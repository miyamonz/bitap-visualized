export function HighlightText({
  children,
  query,
  className,
}: {
  children: string;
  query: string;
  className?: string;
}) {
  if (children === "") return null;
  return <div className={className}>{highlightMatch(children, query)}</div>;
}

const highlightMatch = (text: string, query: string) => {
  if (query === "") {
    return text;
  }
  const words = query.split(" ").filter((w) => w !== "");
  const regex = new RegExp(`(${words.join("|")})`, "i");
  const parts = text.split(regex);
  console.log(query, words, parts);
  return (
    <>
      {parts.map((part, index) => {
        return (
          // unmatch, match, unmatch, match, unmatch, ...
          <Chars key={index} match={index % 2 === 1}>
            {part}
          </Chars>
        );
      })}
    </>
  );
};
const Chars = ({ match, children }: { match: boolean; children: string }) => {
  if (match) return <span style={{ background: "orange" }}>{children}</span>;
  else return <>{children}</>;
};
