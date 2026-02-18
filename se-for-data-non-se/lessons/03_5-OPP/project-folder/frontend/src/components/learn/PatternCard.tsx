import CodeRefBlock from "./CodeRefBlock";

type Props = {
  id: string;
  name: string;
  why: string;
  where: string;
  runtimeEvidence: string;
  antiPattern: string;
  testHint: string;
  codeRef: {
    file: string;
    snippet: string;
  };
};

export default function PatternCard(props: Props) {
  return (
    <article id={props.id} className="pattern-card">
      <section className="pattern-text-panel">
        <div className="pattern-head">
          <h3>{props.name}</h3>
        </div>
        <div className="pattern-points">
          <p><strong>Why:</strong> {props.why}</p>
          <p><strong>Where:</strong> {props.where}</p>
          <p><strong>Runtime evidence:</strong> {props.runtimeEvidence}</p>
          <p><strong>Avoid:</strong> {props.antiPattern}</p>
          <p><strong>Test hint:</strong> {props.testHint}</p>
        </div>
      </section>
      <section className="pattern-code-panel">
        <CodeRefBlock file={props.codeRef.file} snippet={props.codeRef.snippet} />
      </section>
    </article>
  );
}
