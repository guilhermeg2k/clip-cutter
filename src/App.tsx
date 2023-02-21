import { path } from "@tauri-apps/api";
import { open } from "@tauri-apps/api/dialog";
import { Command } from "@tauri-apps/api/shell";
import { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.min.css";

const VIDEO_EXTENSIONS = ["mp4", "mkv", "avi", "mov", "webm"];

const buildCommand = async (
  filePath: string,
  outputFileName = "",
  startTime: string,
  endTime: string,
  isToReduceQuality: boolean
) => {
  const fileExt = await path.extname(filePath);
  const inputFileName = await path.basename(filePath, fileExt);

  if (!outputFileName) {
    outputFileName = `${inputFileName}-cut`;
  }

  const outputFilePath = await path.join(
    await path.dirname(filePath),
    `${outputFileName}.mp4`
  );

  let ffmpegCutCommand = null;

  if (isToReduceQuality) {
    ffmpegCutCommand = new Command("ffmpeg", [
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
  } else {
    ffmpegCutCommand = new Command("ffmpeg-full-quality", [
      "-i",
      filePath,
      "-ss",
      startTime,
      "-to",
      endTime,
      "-c",
      "copy",
      outputFilePath,
    ]);
  }

  return ffmpegCutCommand;
};

const cutFile = async (
  filePath: string,
  outputFileName = "",
  startTime: string,
  endTime: string,
  isToReduceQuality: boolean,
  onError: (error: unknown) => void,
  onClose: () => void
) => {
  const ffmpegCutCommand = await buildCommand(
    filePath,
    outputFileName,
    startTime,
    endTime,
    isToReduceQuality
  );

  ffmpegCutCommand.on("error", onError);
  ffmpegCutCommand.on("close", onClose);

  await ffmpegCutCommand.execute();
};

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

const App = () => {
  const [file, setFile] = useState<string | null>(null);
  const [outputFileName, setOutputFileName] = useState("output.mp4");
  const [isToDeleteFileAfterCut, setIsToDeleteFileAfterCut] = useState(true);
  const [
    isToReduceFileSizeByDecreasingQuality,
    setIsToReduceFileSizeByDecreasingQuality,
  ] = useState(true);
  const [startTime, setStartTime] = useState("00:00:00");
  const [endTime, setEndTime] = useState("00:00:00");

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

  const onCutFile = () => {
    cutFile(
      file!,
      outputFileName,
      startTime,
      endTime,
      isToReduceFileSizeByDecreasingQuality,
      () => toast("Error while cutting file", { type: "error" }),
      () => toast("Finish cutting file")
    );
  };

  return (
    <>
      <ToastContainer />
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
                <span>Start Time*</span>
                <Input
                  type="text"
                  value={startTime}
                  placeholder="00:00:00"
                  onChange={(event) => setStartTime(event.target.value)}
                />
              </Label>
              <Label className="w-full">
                <span>End Time*</span>
                <Input
                  type="text"
                  value={endTime}
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
                value={outputFileName}
                onChange={(event) => setOutputFileName(event.target.value)}
              />
            </Label>
            <div className="flex gap-1 items-center">
              <Input
                type="checkbox"
                checked={isToDeleteFileAfterCut}
                className="rounded-sm border text-emerald-500 
              hover:border-emerald-900 focus:border-emerald-600 focus:ring-emerald-300"
                onChange={(event) =>
                  setIsToDeleteFileAfterCut(event.target.checked)
                }
              />
              <Label htmlFor="output">Delete file after cut</Label>
            </div>
            <div className="flex gap-1 items-center">
              <Input
                type="checkbox"
                checked={isToReduceFileSizeByDecreasingQuality}
                className="rounded-sm border text-emerald-500 
              hover:border-emerald-900 focus:border-emerald-600 focus:ring-emerald-300"
                onChange={(event) =>
                  setIsToReduceFileSizeByDecreasingQuality(event.target.checked)
                }
              />
              <Label htmlFor="output">
                Decrease quality to reduce file size
              </Label>
            </div>

            <button
              type="button"
              className="p-4 bg bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-500 text-white font-semibold uppercase w-full rounded-md duration-200 ease-in-out"
              onClick={onCutFile}
            >
              Cut!
            </button>
          </form>
        </div>
      </main>
    </>
  );
};

export default App;
