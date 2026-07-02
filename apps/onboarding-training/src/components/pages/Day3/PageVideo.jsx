import VideoSubmissionTemplate from '../../shared/VideoSubmissionTemplate';

export default function PageVideoDay3() {
  return (
    <VideoSubmissionTemplate
      day={3}
      title="Day 3 Video Submission"
      prompt="Final question: What is the one thing you've learned across these three days that will most change how you show up at work? Record yourself answering — natural, specific, your own voice."
      exampleLabel="REFERENCE — DAY 1 EXAMPLE VIDEO"
      nextPath="/day3/complete"
      nextLabel="▶ Finish Onboarding"
      mascotMessage="Last submission! One short video — what's the biggest takeaway from your three days? Be honest and specific. Then we wrap this whole journey."
    />
  );
}
