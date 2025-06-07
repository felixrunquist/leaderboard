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
