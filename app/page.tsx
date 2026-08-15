import { readFileSync } from "node:fs";
import { join } from "node:path";

function getBodyHtml() {
  return readFileSync(join(process.cwd(), "racktag-body.html"), "utf8");
}

export default function Page() {
  return <div dangerouslySetInnerHTML={{ __html: getBodyHtml() }} />;
}
