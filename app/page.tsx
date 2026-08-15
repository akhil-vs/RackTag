import bodyHtml from "../racktag-body.html";

export default function Page() {
  return <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />;
}
