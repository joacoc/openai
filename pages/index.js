import Head from "next/head";
import { useEffect, useState } from "react";
import styles from "./index.module.css";

export default function Home() {
  const [microserviceInput, setMicroserviceInput] = useState("");
  const [result, setResult] = useState();
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    setCounter(microserviceInput.length);
  }, [microserviceInput]);

  async function onSubmit(event) {
    event.preventDefault();
    try {
      setResult("");
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ microservice: microserviceInput }),
      });

      const data = await response.body;
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }

      const reader = data.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value);
        setResult((prev) => prev + chunkValue);
      }
    } catch(error) {
      // Consider implementing your own error handling logic here
      console.error(error);
      alert(error.message);
    }
  }

  console.log(result);

  return (
    <div>
      <Head>
        <title>Materialize</title>
        <link rel="icon" href="/materialize.svg" />
      </Head>

      <main className={styles.main}>
        <h1 className="text-4xl">🤔</h1>
        <h3 className="text-4xl">This microservice could have been a SQL query?</h3>
        <form onSubmit={onSubmit}>
          <div className="flex flex-col w-full py-2 flex-grow md:py-3 md:pl-4 relative border border-black/10 bg-white dark:border-gray-900/50 dark:text-white dark:bg-gray-700 rounded-md shadow-[0_0_10px_rgba(0,0,0,0.10)] dark:shadow-[0_0_15px_rgba(0,0,0,0.10)]">
            <textarea
              name="microservice"
              rows="4"
              cols="50"
              tabIndex={0}
              placeholder="Enter your microservice description, code or a snippet"
              value={microserviceInput}
              onChange={(e) => setMicroserviceInput(e.target.value)}
              className="m-0 w-full resize-none border-0 border-transparent focus:border-transparent bg-transparent p-0 pl-2 pr-7 ring-0 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 dark:bg-transparent md:pl-0"
            />
          </div>
          <input type="submit" value="Generate query" className="mt-2" />
        </form>
        <pre>
          <code>
            <p className={"text-center w-1/2 m-auto mt-10 whitespace-pre-line font-mono"}>{result}</p>
          </code>
        </pre>
      </main>
    </div>
  );
}
