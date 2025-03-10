const logger = require('../../utils/logger')('COVID-19-Vaccination');
const axios = require('axios');

// this is a direct download link to the CSV file - if you need details on the structure, download it.
const US_DATA_SRC = 'https://raw.githubusercontent.com/owid/covid-19-data/master/public/data/vaccinations/us_state_vaccinations.csv';
const WORLD_DATA_SRC = 'https://raw.githubusercontent.com/owid/covid-19-data/master/public/data/vaccinations/vaccinations.csv';
// maximum lifetime of any given download of US_DATA_SRC.
// downloads are cached for fast reuse, but will be discarded after this amount of time (milliseconds).
const DATA_SOURCE_LIFETIME = 1 * 24 * 60 * 60 * 1000; // 1 day

function dictPathOrEmptyInit(dict, path) {
    for (const key of path) {
        let sub = dict[key];
        if (sub === undefined) {
            sub = {};
            dict[key] = sub;
        }
        dict = sub;
    }
    return dict;
}

function isGoodData(data){
    for(const key in data) {
        if (!data[key]) return false;
    }
    return true;
}

let US_CACHE = undefined;
let US_TIMESTAMP = undefined;
async function getUSData() {
    if (US_CACHE !== undefined && Date.now() - US_TIMESTAMP <= DATA_SOURCE_LIFETIME) return US_CACHE;

    logger.info(`requesting data from ${US_DATA_SRC}`);
    const resp = await axios({url: US_DATA_SRC, method: 'GET'});
    if (resp.status !== 200) {
        logger.error(`download failed with status ${resp.status}`);
        return {}; // return empty data set on failure
    }
    logger.info('download complete - restructuring data');

    const res = {};
    let first = true;
    for (const row of resp.data.split(/\r?\n/)) {
        if (first) {
            first = false;
            continue;
        }

        const vals = row.split(',');
        if (vals.length !== 14) continue;

        const rawDate = vals[0].split('-');
        const date = `${rawDate[1]}/${rawDate[2]}/${rawDate[0]}`;
        const state = vals[1];

        const data = {
            'total vaccinations': parseFloat(vals[2]),
            'people vaccinated': parseFloat(vals[4]),
            'people fully vaccinated': parseFloat(vals[7]),
            'daily vaccinations raw': parseFloat(vals[10]),
            'daily vaccinations': parseFloat(vals[11]),
            'total vaccinations per hundred': parseFloat(vals[6]),
            'people vaccinated per hundred': parseFloat(vals[8]),
            'people fully vaccinated per hundred': parseFloat(vals[5]),
            'daily vaccinations per million': parseFloat(vals[12]),
            
            // not available in other data source:
            //'total distributed': parseFloat(vals[3]),
            //'distributed per hundred': parseFloat(vals[9]),
            //'share dose used': parseFloat(vals[13]),
        };

        if (!isGoodData(data)) continue;
        const entry = dictPathOrEmptyInit(res, [state, date]);
        for (const key in data) {
            entry[key] = data[key];
        }
    }

    logger.info('restructure complete - caching result');
    US_CACHE = res;
    US_TIMESTAMP = Date.now();
    return res;
}

let WORLD_CACHE = undefined;
let WORLD_TIMESTAMP = undefined;
async function getWorldData() {
    if (WORLD_CACHE !== undefined && Date.now() - WORLD_TIMESTAMP <= DATA_SOURCE_LIFETIME) return WORLD_CACHE;

    logger.info(`requesting data from ${WORLD_DATA_SRC}`);
    const resp = await axios({url: WORLD_DATA_SRC, method: 'GET'});
    if (resp.status !== 200) {
        logger.error(`download failed with status ${resp.status}`);
        return {}; // return empty data set on failure
    }
    logger.info('download complete - restructuring data');

    const res = {};
    let first = true;
    for (const row of resp.data.split(/\r?\n/)) {
        if(first) {
            first = false;
            continue;
        }

        const vals = row.split(',');
        if (vals.length !== 12) continue;

        const country = vals[0];
        const rawDate = vals[2].split('-');
        const date = `${rawDate[1]}/${rawDate[2]}/${rawDate[0]}`;

        const data = {
            'total vaccinations': parseFloat(vals[3]),
            'people vaccinated': parseFloat(vals[4]),
            'people fully vaccinated': parseFloat(vals[5]),
            'daily vaccinations raw': parseFloat(vals[6]),
            'daily vaccinations': parseFloat(vals[7]),
            'total vaccinations per hundred': parseFloat(vals[8]),
            'people vaccinated per hundred': parseFloat(vals[9]),
            'people fully vaccinated per hundred':parseFloat(vals[10]),
            'daily vaccinations per million':parseFloat(vals[11]),
        };

        if (!isGoodData(data)) continue;
        const entry = dictPathOrEmptyInit(res, [country, date]);
        for (const key in data) {
            entry[key] = data[key];
        }
    }

    logger.info('restructure complete - caching result');
    WORLD_CACHE = res;
    WORLD_TIMESTAMP = Date.now();
    return res;
}

module.exports = {getUSData, getWorldData};
