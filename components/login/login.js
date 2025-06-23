import styles from "./login.module.scss";
import { useEffect, useState, useRef } from "react";

import { fetchApi } from "@/l/helper";
// import {useAuth} from "@/l/hooks";
import { useRouter } from "next/router";

export default function Login() {
    const router = useRouter();

    const [loggingIn, setLoggingIn] = useState(false);
    const [error, setError] = useState("");

    function redirect() {
        if (router.query.ref) {
            router.push(router.query.ref);
        } else {
            router.push('/')
        }
    }

    useEffect(() => {
        async function verifyAuth() {
            const res = await fetch('/api/verify-auth');
            if (res.status == 200) {
                redirect();
            }
        }
        verifyAuth()
    }, [])

    async function login(e) {
        e.preventDefault();
        setLoggingIn(true);
        setError("");

        const formData = new FormData(e.target)
        console.log(JSON.stringify(Object.fromEntries(formData.entries())))

        console.log("Logging in");

        const res = await fetch('/api/auth', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(Object.fromEntries(formData.entries())),
        });
        let json;
        try {
            json = await res.json();
        } catch (e) {
            setLoggingIn(false);
            setError("There was an error");
            return;
        }

        if (res.status != 200) {
            setError("Error: " + json.error);
        } else {
            redirect()
        }
        setLoggingIn(false);
    }

    return (<main className={styles.main}>
        <div className={styles.container}>
            <h1>Log in</h1>
            <form onSubmit={login}>
                <input type="text" placeholder="Username" id="username" name="username"></input>
                <input type="password" placeholder="Password" id="password" name="password"></input>
                <button type="submit" disabled={loggingIn}>
                    {loggingIn ? "Logging in..." : "Log in"}
                </button>
                {error != "" && <p className="error">{error}</p>}
            </form>
        </div>
    </main>);
}
