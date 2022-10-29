import React from 'react';
import { useDispatch, useSelector } from "react-redux";
import { setEntriesFilter } from "./redux/actions";
import _ from "lodash";

import { Input } from 'reactstrap';


const searchDebounce = _.debounce((val, callback) => callback(val), 500)


const MMListFilter = (props) => {
    const [filter, setFilter] = React.useState(useSelector(state => state.entriesFilter));
    const [spinner, setSpinner] = React.useState(false);

    const dispatch = useDispatch();

    const setEntriesFilterEmit = (val) => {
        setSpinner(false);
        dispatch(setEntriesFilter(val));
    }

    const onChange = (event) => {
        const val = event.target.value;

        setSpinner(true);
        setFilter(val);
        searchDebounce(val, setEntriesFilterEmit);
    }

    return (
        <>
            <>Search:</>
            <Input className="mc-input" value={filter} onChange={onChange}/>
            <>{spinner ? `Searching...` : ``}</>
        </>
    );
}

export default MMListFilter;
