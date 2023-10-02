import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from "react-redux";
import { setCollectionEntry } from "./redux/actions";
import { MMCollectionCard } from "./MMCollectionCard.jsx"

import _ from "lodash";


const integerFromString = (str) => {
    return Number.parseInt(str.match(/\d+/)[0]);
}


const extractSeriesFromEntry = (entry) => {
    const seriesTag = _.find(entry.tags, t => t.startsWith("series:"));
    const episodeTag = _.find(entry.tags, t => t.startsWith("episode:"));
    const seasonTag = _.find(entry.tags, t => t.startsWith("season:"));

    if (typeof seriesTag === `undefined`) return null;
    if (typeof episodeTag === `undefined`) return null;

    const series = seriesTag.split(":").slice(1).join(":");
    const episode = integerFromString(episodeTag);
    const season = seasonTag ? integerFromString(seasonTag) : null;

    return {series, episode, season};
}


const extractSeriesFromEntries = (entries) => {
    const allSeriesMap = new Map();
    for (const entry of entries) {
        const data = extractSeriesFromEntry(entry);
        if (!data) continue;

        const {series, episode, season} = data;
        const seasonKey = season || `unlabeled`;

        const seriesMap = allSeriesMap.get(series) || new Map();
        const seasonsMap = seriesMap.get(`seasons`) || new Map();
        const episodesMap = seasonsMap.get(seasonKey) || new Map();
        const episodeEntryList = episodesMap.get(episode) || [];

        episodeEntryList.push(entry);
        episodesMap.set(episode, episodeEntryList);
        seasonsMap.set(seasonKey, episodesMap);
        seriesMap.set(`seasons`, seasonsMap);
        seriesMap.set(`name`, series);
        allSeriesMap.set(series, seriesMap);
    }
    return allSeriesMap;
}


const listEntryTemplate = (series) => {
    const seriesName = series.get(`name`);
    return (
        <MMCollectionCard key={seriesName} name={seriesName} entry={series} />
    );
}


const listEntriesTemplate = (entries) => {
    if (!entries) return <div></div>;
    return (
        <div className="list-entries">
            {entries.map(listEntryTemplate)}
        </div>
    );
}


export const MMCollectionList = (props) => {
    const entries = useSelector(state => state.entries);
    const [series, setSeries] = useState(new Map());

    const dispatch = useDispatch();

    useEffect(() => {
        setSeries(extractSeriesFromEntries(entries || []));
    }, [entries]);

    const setCollectionEntryEvent = (entry) => {
        dispatch(setCollectionEntry(entry));
    }

    const seriesByName = Array.from(series.values())
        .sort((a,b) => a.get(`name`).localeCompare(b.get(`name`)));

    return (
        <div style={{display: "flex"}}>
            {listEntriesTemplate(seriesByName)}
        </div>
    );
}
