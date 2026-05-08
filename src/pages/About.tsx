import Layout from "@/components/Layout";
import alexPhoto from "@/assets/alex-macgregor.png";
import { Helmet } from "react-helmet-async";

const About = () => {
  return (
    <Layout>
      <Helmet>
        <title>About — Media AI</title>
        <meta name="description" content="Our story: building a lean, AI-first media database that prizes speed, accuracy, and transparency." />
      </Helmet>

      <article className="container mx-auto px-4 py-16 max-w-3xl">
        <header className="mb-12 text-center">
          <p className="text-sm uppercase tracking-wide text-muted-foreground mb-3">Our story</p>
          <h1 className="text-4xl md:text-5xl font-medium text-foreground mb-4">
            We started this to empower storytellers around the world
          </h1>
          <p className="text-lg text-muted-foreground">
            with the most advanced PR and Influencer Marketing technology that just works.
          </p>
        </header>

        <div className="prose prose-lg max-w-none text-foreground space-y-6">
          <p><strong>Hello there!</strong></p>
          <p>
            I'm Alex MacGregor, a PR strategist who has spent the last decade relying on
            enterprise suites like Meltwater, Cision, and Muck Rack to get coverage for
            tech brands across Asia-Pacific.
          </p>
          <p>
            Those platforms were revolutionary once, but somewhere along the way they
            traded focus for feature bloat. Pricing climbed, dashboards grew dense, and
            the contact lists still missed too many key reporters. I found myself
            wrestling with Boolean strings from the 2010s while the industry around us
            moved to natural-language prompts and AI-assisted workflows.
          </p>
          <p>
            That frustration became the spark for Media AI. We're building a lean,
            AI-first media database that prizes speed, accuracy, and transparency over
            shiny add-ons.
          </p>
          <p>
            Imagine describing your story the way you'd brief a colleague—"Fintech
            reporters in Jakarta covering women-led startups"—and seeing a list of
            verified contacts in seconds, not minutes. Then imagine paying a fair,
            cancel-anytime rate for that clarity instead of an annual contract padded
            with modules you'll never open.
          </p>
          <p>
            Our small team writes code in the daylight and verifies data at night,
            propelled by a simple goal: help you do great PR without the busywork.
            We'd rather invest in product improvements than celebrity keynotes; rather
            answer a customer email than craft another upsell deck.
          </p>
          <p>
            Above all, we believe the best software feels invisible—it melts into your
            daily rhythm so you can focus on pitching stories, not clicking buttons.
          </p>
          <p>
            If that vision resonates, stay close. We'll be sharing progress openly and
            shipping fast. Together we can build the tool our industry has been waiting
            for.
          </p>
          <p>
            Thanks for reading, and for giving Media AI a try. You can always contact
            me directly if you have any questions at{" "}
            <a href="mailto:alex@trymedia.ai" className="text-primary hover:underline">alex@trymedia.ai</a>.
            I look forward to hearing from you.
          </p>

          <div className="pt-8">
            <img
              src={alexPhoto}
              alt="Alex MacGregor"
              className="w-20 h-20 rounded-md object-cover mb-4"
            />
            <p className="font-medium mb-1">— Alex MacGregor</p>
            <p className="text-muted-foreground mb-3">Founder, Media AI</p>
            <a
              href="https://www.linkedin.com/in/alexmacgregor2/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline text-sm"
            >
              Connect with me on LinkedIn →
            </a>
          </div>
        </div>
      </article>
    </Layout>
  );
};

export default About;
