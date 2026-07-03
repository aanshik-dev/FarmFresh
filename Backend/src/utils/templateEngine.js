import fs from "fs";

const loadTemplate = (path, data) => {

  let html = fs.readFileSync(path, "utf8");

  Object.keys(data).forEach((key) => {

    html = html.replaceAll(
      `{{${key}}}`,
      String(data[key] ?? "")
    );

  });

  return html;
};

export default loadTemplate;