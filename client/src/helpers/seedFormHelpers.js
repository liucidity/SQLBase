import {
  sampleCompanies,
  sampleProducts,
  sampleEmployees,
} from "../state/data_structures/seedState";

const sampleSeedState = {
  companies: sampleCompanies,
  employees: sampleEmployees,
  products: sampleProducts,
};

export const generateSeedSQL = seedState => {
  const seedStrings = [];

  Object.entries(seedState[0]).forEach(([table, seedData]) => {
    if (!seedData || seedData.length === 0) return;

    let firstLine = `INSERT INTO ${table}(`;
    let values = `VALUES`;

    seedData.forEach((dataset, j) => {
      Object.entries(dataset).forEach(([field, value], k) => {
        if (j === 0) {
          k === Object.keys(dataset).length - 1
            ? (firstLine += `"${field}")`)
            : (firstLine += `"${field}", `);
        }
        if (k === 0) {
          values += ` (${typeof value === "number" ? value : "'" + value + "'"}, `;
        } else if (k === Object.keys(dataset).length - 1) {
          j === seedData.length - 1
            ? (values += `${typeof value === "number" ? value : "'" + value + "'"})`)
            : (values += `${typeof value === "number" ? value : "'" + value + "'"}),\n                  `);
        } else {
          values += `${typeof value === "number" ? value : "'" + value + "'"}, `;
        }
      });
    });

    seedStrings.push(
      `${firstLine}\n    ${values};`
        .replace(/L'O/g, "LO")
        .replace(/l's/g, "ls")
        .replace(/g's/g, "gs")
    );
  });

  return seedStrings.join("\r\n\n");
};
