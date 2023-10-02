import React from 'react';
import { useDispatch, useSelector } from "react-redux";
import { setDetailEntry, clearCollectionEntry } from "./redux/actions";

import { Button, Card, CardBody, CardColumns, CardSubtitle, CardText, CardTitle, UncontrolledCollapse } from 'reactstrap';

import _ from "lodash";

import MMTag from "./MMTag";


const stringToHashInt = (string) => {
    // SOURCE: https://stackoverflow.com/questions/6122571/simple-non-secure-hash-function-for-javascript
    var hash = 0;
    for (var i = 0; i < string.length; i++) {
        var char = string.charCodeAt(i);
        hash = ((hash<<5)-hash)+char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}

const stringToHashFloat = (string) => {
    return Math.abs(stringToHashInt(string)) / 2**32
}

const intToHex = (int) => {
    return int.toString(16).padStart(2, `0`);
}

const shuffleList = (list) => {
    return list.sort(() => Math.random() - 0.5)
}

const randomFullSaturationRgbValue = () => {
    const rgbValues = [0, 1, Math.random()];
    return `#${shuffleList(rgbValues).map(f => Math.round(f * 255)).map(intToHex).join(``).toUpperCase()}`;
}

// const rgbValueFromString(string) => {

// }


const tagTemplate = (tag, color) => {
    return <MMTag key={tag} tag={tag} color={color}/>
}


const episodeEntryTemplate = (entry, setDetailEntryEvent) => {
    return (
        <Button className="mc-button" style={{flex: 4}} onClick={() => setDetailEntryEvent(entry)}>
            {entry.name}
        </Button>
    );
}


const episodeTemplate = (series, season, episode, entryList, setDetailEntryEvent) => {
    console.log(episode, entryList)

    const videoContent = _.find(entryList, e => e.name.endsWith(".mp4"));

    return (
        <Card key={`${series}-${season}-${episode}`}>
            {/*{tagTemplate(`Season ${season.toString().padStart(2, "0")}`)}*/}
            {tagTemplate(`Episode ${episode.toString().padStart(2, "0")}`, `blue`)}
            <div style={{display: "flex", flexDirection: "column"}}>
                {entryList.map(entry => episodeEntryTemplate(entry, setDetailEntryEvent))}
            </div>
        </Card>
    );
}


const seasonTemplate = (series, season, episodesMap, setDetailEntryEvent) => {
    console.log(season);
    console.log(episodesMap);
    const episodesByNumber = Array.from(episodesMap.keys()).sort((a,b) => parseInt(a) - parseInt(b))

    const title = season ? `Season ${season}` : `Unsorted episodes`;
    return (
        <Card className="border-0">
            <h2>
                <Button color="primary" id={`toggle-season-${season}`} style={{ marginBottom: "1rem" }}>
                    {title}
                </Button>
            </h2>
            <UncontrolledCollapse toggler={`#toggle-season-${season}`}>
                <CardColumns key={`${series}-${season}`}>
                    {episodesByNumber.map(episode => episodeTemplate(
                        series, season, episode, episodesMap.get(episode), setDetailEntryEvent
                    ))}
                </CardColumns>
            </UncontrolledCollapse>
        </Card>
    );
}


const seasonsTemplate = (series, seasonsMap, setDetailEntryEvent) => {
    console.log(seasonsMap);
    const seasonsByName = Array.from(seasonsMap.keys()).sort()
    return (
        <>
            <h1>{series}</h1>
            <div style={{flex: 4, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", flexWrap: "wrap"}}>
                {seasonsByName.map(season => seasonTemplate(
                    series, season, seasonsMap.get(season), setDetailEntryEvent
                ))}
            </div>
        </>
    );
}


export const MMCollection = (props) => {
    const series = useSelector(state => state.collectionEntry);

    const dispatch = useDispatch();

    const clearCollectionEntryEvent = () => {
        dispatch(clearCollectionEntry());
    }

    const setDetailEntryEvent = (entry) => {
        dispatch(setDetailEntry(entry));
    }

    if (!series) return <></>;

    const seriesName = series.get(`name`);

    return (
        <Card style={{display: "flex"}}>
            <Button className="mc-button" style={{flex: 4}} onClick={clearCollectionEntryEvent}>
                Back
            </Button>
            {/*<Card style={{width: '18rem'}}>
              <img alt="Sample" src="https://picsum.photos/300/200"/>
              <CardBody>
                <CardTitle tag="h5">Card title</CardTitle>
                <CardSubtitle className="mb-2 text-muted" tag="h6">Card subtitle</CardSubtitle>
                <CardText>Some quick example text to build on the card title and make up the bulk of the card's content.</CardText>
                <Button>Button</Button>
              </CardBody>
            </Card>*/}

            {/*<div style={{flex: 1, display: "flex", alignItems: "center", justifyContent: "center"}}>
                ({props.entry.service})
            </div>*/}

            {/*<div style={{flex: 4, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "row", flexWrap: "wrap"}}>*/}
            <>
                {seasonsTemplate(seriesName, series.get(`seasons`), setDetailEntryEvent)}
            </>
        </Card>
    );
}
