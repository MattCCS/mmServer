import React from 'react';
import { useDispatch } from "react-redux";
import { setCollectionEntry } from "./redux/actions";

import { Button, Card, CardBody, CardSubtitle, CardText, CardTitle } from 'reactstrap';

// import MMTag from "./MMTag";


// const tagTemplate = (tag) => {
//     return <MMTag key={tag} tag={tag}/>
// }


export const MMCollectionCard = (props) => {
    const dispatch = useDispatch();

    const setCollectionEntryEvent = (entry) => {
        dispatch(setCollectionEntry(entry));
    }

    return (
        <Card style={{display: "flex"}}>
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
            <Button className="mc-button" style={{flex: 4}} onClick={() => setCollectionEntryEvent(props.entry)}>
                {props.name}
            </Button>
            {/*<div style={{flex: 4, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "row", flexWrap: "wrap"}}>
                {Array.from(props.entries.values()).map(tagTemplate)}
            </div>*/}

            {/*{% endif %}*/}
        </Card>
    );
}
