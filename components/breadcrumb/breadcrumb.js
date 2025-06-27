import Link from 'next/link';
import styles from './breadcrumb.module.scss';
import { useEffect, useState, useRef, Fragment } from 'react'

import { FaChevronRight } from "react-icons/fa6";


export default function Breadcrumb({children}){
    return (
      <div className={styles.container}>
        {children.map((i,k) => <Fragment key={k}>
        {k > 0 && <span className={styles.chevron}><FaChevronRight/></span>}
        {i.href ? <Link href={i.href}>{i.name}</Link> : <a>{i.name}</a>}
        </Fragment>)}
      </div>
    )
}
