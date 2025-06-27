import { fromNow, getDelta } from '@/l/helper';
import styles from './line-chart.module.scss';
import {useState, useMemo, useCallback } from 'react'

import { Tooltip } from 'react-tooltip';
// import { useSynchronizedState } from '@/l/hooks';

function colorize(i) {
    if (i < 75000) return 'green';
    if (i < 150000) return 'yellow';
    if (i < 600000) return 'orange';
    return 'red';
}

export default function LineChart({ values, time = false }) {
    const [logScale, setLogScale] = useState(false)

    const [extrema, setExtrema] = useState({min: 0, max: 0});

    const allTicks = useMemo(() => [
        { delta: 0, label: 'Now' },
        { delta: 60, label: '1min' },
        { delta: 60 * 5, label: '5min' },
        { delta: 60 * 30, label: '30min' },
        { delta: 60 * 60, label: '1h' },
        { delta: 60 * 60 * 12, label: '12h' },
        { delta: 60 * 60 * 24, label: '1d' },
        { delta: 60 * 60 * 24 * 7, label: '1w' },
        { delta: 60 * 60 * 24 * 30, label: '1m' },
        { delta: 60 * 60 * 24 * 30 * 6, label: '6m' },
        { delta: 60 * 60 * 24 * 365, label: '1yr' },
    ], [])

    const getPosition = useCallback((i, min, max) => {
        if (time && i == 0) return 1;
        let res; 
        if(logScale){
            res =  Math.log(i - min) / Math.log(max - min)
        } else {
            res =  (i - min) / (max - min)
        }
        return time ? 1 - res : res; 
    }, [logScale, time])

    const points = useMemo(() => {
        if(time){
            const p = values.map(i => ({ ...i, delta: getDelta(i.value) }))
            const maxTimeValue = Math.max(...p.map(i => i.delta))
            setExtrema({min: 0, max: maxTimeValue})
            return p.sort((a,b) => b.delta - a.delta).map(i => ({ ...i, position: getPosition(i.delta, 0, maxTimeValue), label: `${i.name} (${fromNow(i.value)})`, background: colorize(i.delta) }))
        }else{
            const max = Math.max(...values.map(i => i.value))
            const min = Math.min(...values.map(i => i.value))
            setExtrema({min, max})
            return values.sort((a,b) => a.value - b.value).map(i => ({...i, position: getPosition(i.value, min, max), label: `${i.name} (${i.value})`, background: 'white'}))
        }
    }, [values, logScale, time])

    const ticks = useMemo(() => {
        if(time){
            const visibleTicks = allTicks.filter(i => i.delta <= extrema.max).map(i => ({ ...i, position: getPosition(i.delta * 1000, extrema.min, extrema.max), fromNow: fromNow(new Date().getTime() - i.delta * 1000) }));
            const lastLabel = fromNow(new Date().getTime() - maxValue);
            if (!visibleTicks.map(i => i.fromNow).includes(lastLabel)) {
                visibleTicks.push({ position: 0, label: lastLabel }) // Max value
            }
            return visibleTicks
        }else{
            return [{position: 0, label: "" + extrema.min}, {position: 1, label: "" + extrema.max}];
        }
    }, [extrema, logScale, time])

    if(!values || values.length == 0){
        return <p>Loading...</p>
    }

    return (<div className={styles.container}>
        {/* <div className={styles.toolbar}>
            <label>
                {logScale ? 'Log scale' : 'Linear scale'}
                <input type="checkbox" className="pill" checked={logScale} onChange={e => setLogScale(e.target.checked)}/>
            </label>
        </div> */}
        <div className={styles.chart}>
            <Tooltip id="tooltip" style={{ zIndex: 3 }} />
            {points.map(i => <span key={i.name} data-tooltip-position-strategy="fixed" data-tooltip-id="tooltip" data-tooltip-content={i.label} className={styles.point} style={{ left: `${i.position * 100}%`, background: i.background }} />)}
            {ticks.map(i => <span key={i.label} className={styles.tick} style={{ left: `${i.position * 100}%`, '--var-label': JSON.stringify(i.label) }} />)}
        </div>
    </div>)
}
