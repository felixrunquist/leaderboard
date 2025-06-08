import {useEffect, useState, useRef} from "react";

export function useScroll(fn) {
    const scrollRef = useRef(false);
    const oldScrollRef = useRef(0);

    useEffect(() => {
        window.addEventListener("scroll", scroll);
        return () => {
            window.removeEventListener("scroll", scroll);
        };
    });

    function scroll() {
        if (!scrollRef.current) {
            requestAnimationFrame(() => {
                fn(window.scrollY, oldScrollRef.current);
                oldScrollRef.current = window.scrollY;
                scrollRef.current = false;
            });
            scrollRef.current = true;
        }
    }
}

export const useDidMountEffect = (func, deps) => {
    const didMount = useRef(false);

    useEffect(() => {
        if (didMount.current)
            func(); // eslint-disable-line react-hooks/exhaustive-deps
        else didMount.current = true;
    }, deps); // eslint-disable-line react-hooks/exhaustive-deps
};

export const useAnimationFrame = (func) => {
    const requested = useRef(false);

    return () => {
        if (requested.current) {
            return;
        }
        requestAnimationFrame(() => {
            func();
            requested.current = false;
        });
        requested.current = true;
    };
};

export function usePrefersDarkMode() {
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        setIsDarkMode(
            window.matchMedia &&
                window.matchMedia("(prefers-color-scheme: dark)").matches,
        );
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handler = (event) => setIsDarkMode(event.matches);

        // Modern browsers
        mediaQuery.addEventListener("change", handler);

        return () => mediaQuery.removeEventListener("change", handler);
    }, []);

    return isDarkMode;
}

export const useSynchronizedState = (def, key) => {
    const [state, setState] = useState(null);

    useEffect(() => {
        // Add global update hook
        if(window['sync-update-' + key]){
            window['sync-update-' + key].push(handleUpdate)
        }else{
            window['sync-update-' + key] = [handleUpdate]
        }

        const storedState = localStorage.getItem('sync-' + key);
        if(window['sync-' + key]){
            setState(window['sync-' + key])
        }else if(storedState !== null){
            setState(storedState)
            window['sync-' + key] = storedState
        }else{
            setState(def) // Set default state
        }
       

        return () => { // Remove update hook
            if(window['sync-update-' + key] && window['sync-update-' + key].length > 0){
                window['sync-update-' + key] = window['sync-update-' + key].filter(i => i != handleUpdate);
            }
        }

    }, [])

    const causeUpdate = (v) => {
        console.log("Updating " + key + " to ", v)
        setState(v)
        if(!v){
            localStorage.removeItem('sync-' + key)
        }else{
            localStorage.setItem('sync-' + key, v);
        }
        if(window['sync-update-' + key] && window['sync-update-' + key].length > 0){
            window['sync-update-' + key].filter(i => i != handleUpdate).forEach(i => i(v))
        }
    }
    const handleUpdate = (v) => setState(v)
    

    return [state, causeUpdate]

}