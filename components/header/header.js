// import {useAuth} from "@/l/hooks";
import styles from "./header.module.scss";
import {useEffect, useState } from "react";

import { FaPlay, FaUpload, FaMagnifyingGlass } from "react-icons/fa6";


import Link from "next/link";
import Nav, { HeaderLink } from "@/c/nav";
import { SITE_NAME } from "@/l/constants.js";

export default function Header({light = false, eventCount}) {
    // const router = useRouter();
    // const {name, setLoggedIn} = useAuth();

    const [visibleMenu, setVisibleMenu] = useState(false);

    function click(e) {
        e.stopPropagation();
        setVisibleMenu((i) => !i);
    }

    function unClick() {
        setVisibleMenu(false);
    }

    useEffect(() => {
        document.addEventListener("click", unClick);
        return () => document.removeEventListener("click", unClick);
    }, []);

    // function logout() {
    //     console.log("Removing token");
    //     setLoggedIn(false);
    //     router.push("/login");
    // }

    return (
        <>
            <div className={`${styles.container} ${light ? styles.light : styles.dark}`}>
                <Link href="/">
                    <h1>{SITE_NAME}</h1>
                </Link>
                <Nav light={light} style={{flex: 1}}>
                    <HeaderLink text="Run">
                        <FaPlay />
                    </HeaderLink>
                    <HeaderLink text="Upload">
                        <FaUpload />
                    </HeaderLink>
                    <HeaderLink text="View">
                        <FaMagnifyingGlass />
                    </HeaderLink>
                </Nav>
                {/* <a onClick={click} className={styles.profile}>
                    <h3>{name ? name : ""}</h3>
                </a> */}
            </div>
            <div
                className={`${styles.menu} ${visibleMenu && styles.visible}`}
                onClick={(e) => e.stopPropagation()}
            >
            </div>
        </>
    );
}