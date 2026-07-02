import VideoSubmissionTemplate from '../../shared/VideoSubmissionTemplate';

export default function PageVideoDay2() {
  return (
    <VideoSubmissionTemplate
      day={2}
      title="Day 2 Video Submission"
      prompt="Today's question: How would you describe the ebright voice to a new parent in 60 seconds? Record yourself answering — natural tone, real example, clear next step."
      exampleLabel="REFERENCE — DAY 1 EXAMPLE VIDEO"
      nextPath="/day2/complete"
      nextLabel="▶ Finish Day 2"
      mascotMessage="One short video — answer the prompt in your own words. Mirror the structure from Day 1: greet, give a real example, end with a clear next step."
    />
  );
}
