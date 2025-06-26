import styles from "./grid.module.scss";
import { useEffect, useState, useRef, forwardRef, useMemo } from "react";
import { createRoot } from "react-dom/client";

// import { AgGridReact } from 'ag-grid-react'; // React Data Grid Component
import "@ag-grid-community/styles/ag-grid.css"; // Mandatory CSS required by the grid
import "@ag-grid-community/styles/ag-theme-material.css"; // Optional Theme applied to the grid
// import "@/styles/ag-theme-material-no-font.css"; // Optional Theme applied to the grid

import { AgGridReact } from "@ag-grid-community/react";
import { ModuleRegistry } from "@ag-grid-community/core";
import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";

ModuleRegistry.registerModules([ClientSideRowModelModule]);

const defCol = {
    wrapText: true,
    autoHeight: true,
    flex: 1,
    menuTabs: ["sortUnsort", "filterMenuTab"],
};
const defGridOptions = {
    autoSizeStrategy: {
        type: "fitGridWidth",
        defaultMinWidth: 10,
    },
};

const Grid = forwardRef(({ defaultColDef = defCol, gridOptions, pagingPanelElement, ...props }, ref) => {
        const [dark, setDark] = useState(props.dark || false);

        const containerRef = useRef();
        const childElementCreated = useRef(false);

        useEffect(() => {
            if (pagingPanelElement && !childElementCreated.current) {
                const panel =
                    containerRef.current.querySelector(".ag-paging-panel");
                if (panel == null) {
                    return;
                }
                const rootElem = document.createElement("div");
                rootElem.style.flex = 1;
                panel.prepend(rootElem);
                const root = createRoot(rootElem);
                root.render(pagingPanelElement);
                childElementCreated.current = true;
            }
        });

        return (
            <div
                ref={containerRef}
                className={`${dark ? "ag-theme-material-dark" : "ag-theme-material"} ${props.sticky ? "ag-sticky-header" : ""} ${styles.container} ${props.className || ""}`}
            >
                <AgGridReact
                    ref={ref}
                    enableCellTextSelection
                    ensureDomOrder
                    gridOptions={{ ...defGridOptions, ...gridOptions }}
                    defaultColDef={defaultColDef}
                    {...props}
                />
            </div>
        );
    },
);
Grid.displayName = "Grid";

export default Grid;
