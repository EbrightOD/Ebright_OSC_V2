import VideoSubmissionTemplate from '../../shared/VideoSubmissionTemplate';

export default function PageVideoDay1() {
  return (
    <VideoSubmissionTemplate
      day={1}
      title="Video Submission Task"
      prompt="Watch the example video first. Then record a video that mirrors the example — same tone, same structure, your own words."
      exampleLabel="EXAMPLE — INTRODUCING YOURSELF TO A PARENT"
      nextPath="/day1/hq-tour"
      mascotMessage="Watch how the tutor in the example greets, introduces themselves, and ends with a clear next step. Mirror that exact flow when you record your own video."
    />
  );
}
