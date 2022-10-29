import React, { useState, useEffect } from 'react';
import { useSelector } from "react-redux";
import './App.css';
import MMList from "./MMList.js"
import MMEntry from "./MMEntry.js"
import { MMCollection } from "./MMCollection.jsx"
import { MMCollectionList } from "./MMCollectionList.jsx"

import { Button, Card, CardBody, Input, Label } from 'reactstrap';
import _ from "lodash";


const App = () => {
    const detailEntry = useSelector(state => state.detailEntry);
    const collectionEntry = useSelector(state => state.collectionEntry);

    const isFocusing = !!(detailEntry || collectionEntry);

    return (
        <div className="App">
            <header className="App-header" style={{'min-height': '10vh'}}>
                <div>📺 mmServer</div>
            </header>

            <Card>
                <CardBody>
                    <MMEntry />
                    {detailEntry ? <></> : <MMCollection />}
                    {isFocusing ? <></> : <MMCollectionList />}
                    {isFocusing ? <></> : <MMList />}
                </CardBody>
            </Card>
        </div>
    );
}

export default App;
