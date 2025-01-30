const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "final project APIs",
            version: "1.0.0",
            description: "API documentation for authentication routes",
        },
        servers: [
            {
                url: "https://nodeback-final.onrender.com", // ✅ Change this to your Render domain
                description: "Render Deployment",
            }
        ],
    },
    apis: ["./src/routes/*.js"], // Scans route files for Swagger docs
};

const swaggerSpec = swaggerJsdoc(options);

const swaggerDocs = (app) => {
    app.use("/doc", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    console.log("📄 Swagger Docs available at https://nodeback-final.onrender.com/doc");
};

module.exports = swaggerDocs;
