import { useEffect, useState } from "react";
import { Command } from "@tauri-apps/api/shell";
import { open } from "@tauri-apps/api/dialog";
import { path, shell } from "@tauri-apps/api";

const VIDEO_EXTENSIONS = ["mp4", "mkv", "avi", "mov", "webm"];

const Label = ({
  htmlFor,
  children,
  className,
  ...props
}: React.DetailedHTMLProps<
  React.LabelHTMLAttributes<HTMLLabelElement>,
  HTMLLabelElement
>) => {
  return (
    <label
      className={`text-emerald-500 font-semibold uppercase flex flex-col gap-1 ${className}`}
      {...props}
    >
      {children}
    </label>
  );
};

const Input = ({
  ...props
}: React.DetailedHTMLProps<
  React.InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
>) => {
  return (
    <input
      className="border border-zinc-700  p-2 outline-none hover:border-emerald-900 focus:border-emerald-600 focus:ring-0 bg-zinc-800"
      {...props}
    />
  );
};

const cutFile = async (
  filePath: string,
  outputFileName: string,
  startTime: string,
  endTime: string
) => {
  const outputFilePath = await path.join(
    await path.dirname(filePath),
    `${outputFileName}.mp4`
  );

  const cutCommandShell = new Command("run-ffmpeg", [
    "-i",
    filePath,
    "-vcodec",
    "libx264",
    "-crf",
    "24",
    "-ss",
    startTime,
    "-to",
    endTime,
    outputFilePath,
  ]);

  cutCommandShell.on("error", (error) =>
    console.error(`command error: "${error}"`)
  );
  cutCommandShell.stdout.on("data", (line) =>
    console.log(`command stdout: "${line}"`)
  );
  cutCommandShell.stderr.on("data", (line) =>
    console.log(`command stderr: "${line}"`)
  );

  await cutCommandShell.execute();
};

const App = () => {
  const [file, setFile] = useState<string | null>(null);
  const [outputFileName, setOutputFileName] = useState("output.mp4");
  const [deleteFileAfterCut, setDeleteFileAfterCut] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const openSelectFileDialog = async () => {
    const file = await open({
      multiple: false,
      filters: [
        {
          name: "Mp4, mkv, avi, mov, webm",
          extensions: VIDEO_EXTENSIONS,
        },
      ],
    });
    setFile(file as string);
  };

  return (
    <main className="bg-zinc-900 w-screen h-screen p-10">
      <div className="flex flex-col items-center w-full justify-center gap-10">
        <h1 className="text-4xl uppercase text-amber-300 font-mono font-bold">
          Clip cutter
        </h1>
        <form className="flex flex-col w-full gap-5 px-16">
          <Label
            htmlFor="file"
            className="border border-zinc-700  p-2 outline-none hover:border-emerald-900 focus:border-emerald-600 focus:ring-0 bg-zinc-800 w-full cursor-pointer"
            onClick={openSelectFileDialog}
          >
            {file ?? "Choose a file*"}
          </Label>
          <div className="flex gap-2 w-full">
            <Label className="w-full">
              {endTime ? "Start time" : "Start Time*"}
              <Input
                type="text"
                placeholder="00:00:00"
                onChange={(event) => setStartTime(event.target.value)}
              />
            </Label>
            <Label className="w-full">
              {startTime ? "End time" : "End Time*"}
              <Input
                type="text"
                placeholder="00:00:00"
                onChange={(event) => setEndTime(event.target.value)}
              />
            </Label>
          </div>
          <Label className="w-full">
            Output file name
            <Input
              type="text"
              placeholder="My Clip"
              onChange={(event) => setOutputFileName(event.target.value)}
            />
          </Label>
          <div className="flex gap-1 items-center">
            <Input
              type="checkbox"
              onChange={(event) => setDeleteFileAfterCut(event.target.checked)}
              className="rounded-sm border text-emerald-500 
              hover:border-emerald-900 focus:border-emerald-600 focus:ring-emerald-300"
            />
            <Label htmlFor="output">Delete file after cut</Label>
          </div>

          <button
            type="button"
            className="p-4 bg bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-500 text-white font-semibold uppercase w-full rounded-md duration-200 ease-in-out"
            onClick={() => cutFile(file!, outputFileName, startTime, endTime)}
          >
            Cut!
          </button>
        </form>
      </div>
    </main>
  );
};

export default App;
