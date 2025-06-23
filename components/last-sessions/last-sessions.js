import styles from './last-sessions.module.scss';
import { useEffect, useState, useRef } from 'react'

export default function LastSessions({ ...props }) {
    return (
        <section>
            <h2>Latest sessions</h2>
            <div className={styles.sessions}>
                <a>
                    <h3>Name →</h3>
                    <p>Description</p>
                </a>
                <a></a>
                <a></a>
                <a></a>

            </div>
        </section>
    )
}
