import styles from './widgets.module.scss';
import { useEffect, useState, useRef } from 'react'

export default function Widgets({...props}){
    return (
        <section className={styles.widgetContainer}>
            <Widget>
                <h3>
                    <span className={styles.info}>167</span> suites, <span className={styles.info}>752</span> sessions. 
                </h3>
            </Widget>
            <Widget/>
            <Widget/>
            <Widget/>
        </section>
    )
}

function Widget({children}){
    return <div className={styles.widget}>{children}</div>
}
