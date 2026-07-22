"use client";

import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";
import swaggerSpec from "@/public/docs/swagger.json";
const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

export default function ApiDocsPage() {
    return (
        <div style={{ backgroundColor: "#fff", minHeight: "100vh" }}>
            <SwaggerUI spec={swaggerSpec} />
        </div>
    );
}