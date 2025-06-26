export function cn(...c){
    return c.filter(i => typeof i != 'undefined' && i != '').join(' ')
}


export function getDelta(t) {
    return new Date().getTime() - new Date(t).getTime();
}

import moment from "moment";
export function fromNow(date) { // Takes a date and converts it into a human-readable format
    // if(typeof date == 'number'){//Convert epoch from s to ms
    //     date *= 1000;
    // }
    const delta = getDelta(date);
    if(delta < 2000){
        return `${delta}ms ago`
    }
    if(delta < 60 * 1000){
        return `${Math.round(delta / 1000)} seconds ago`
    }
    return moment(date).locale("en").fromNow();
}