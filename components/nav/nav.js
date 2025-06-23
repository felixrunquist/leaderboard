import { useRouter } from 'next/router';
import styles from './nav.module.scss';
import { useEffect, useState, useRef } from 'react'
import { cn } from '@/l/helper';

export default function Nav({children, light, padBottom, showText, className, spaced, ...props}){
    
    return (
      <div className={cn(styles.nav, light && styles.light, padBottom && styles.padBottom, showText && styles.showText, spaced && styles.spaced, className)} {...props}>{children}</div>
    )
}

export function HeaderLink({href, children, text, ...props}) {
    const router = useRouter();
    return (
        <a className={`${styles.headerLink} ${router.pathname == href ? styles.active : ''}`} href={href} {...props}>
            {children}
            <p>{text}</p>
        </a>
    );
}