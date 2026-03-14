import React from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet";

export default function MatchPage() {

  const { slug } = useParams();

  const title = slug.replaceAll("-", " ");

  return (
    <div style={{ padding: "20px" }}>

      <Helmet>
        <title>{title} Live Stream | SwiftBall</title>

        <meta
          name="description"
          content={`Watch ${title} live stream, live score and match updates on SwiftBall.`}
        />
      </Helmet>

      <h1>{title} Live Stream</h1>

      <p>
        Watch {title} live football stream, score updates and match highlights on SwiftBall.
      </p>

    </div>
  );
}