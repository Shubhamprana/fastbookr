import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowRight } from "lucide-react";

const FAQ_CATEGORIES = [
  {
    title: "Renting a Property",
    items: [
      { q: "Is it realistic to find a property in my budget?", a: "Yes. You can use our filters to narrow listings by city, property type, and price range so you spend less time on mismatched options." },
      { q: "How long does the rental process typically take?", a: "That depends on the owner response, documents, and visit scheduling. In many cases, qualified renters can move from inquiry to site visit within a few days." },
      { q: "What fees are involved in renting a property?", a: "Charges vary by listing and city. These may include booking amount, security deposit, brokerage or service fee, and move-in amount. You should confirm the exact amount before finalizing the rental." },
      { q: "What documents may be required before move-in?", a: "Owners usually ask for ID proof, employment or student details, and basic tenant information before confirming the booking or rental agreement." },
    ],
  },
  {
    title: "Listing as an Owner",
    items: [
      { q: "How can I list my room or property with RealEstate Pro?", a: "You can submit your property through the listing form with photos, rent details, and location. Our team reviews the listing before publishing it." },
      { q: "Can I list only full apartments, or rooms as well?", a: "You can list rooms, shared rooms, studios, PG/hostel spaces, apartments, houses, and independent floors." },
      { q: "When does my listing go live?", a: "Listings go live after admin review. This helps us reduce spam, incomplete submissions, and misleading property details." },
    ],
  },
  {
    title: "Renting",
    items: [
      { q: "What documents do I need to rent a property?", a: "Typically, you'll need proof of income (pay stubs or tax returns), a valid ID, references from previous landlords, and a completed rental application. Some landlords may also require a credit check." },
      { q: "Can I negotiate the rental price?", a: "Yes, rental prices can often be negotiated, especially if you're willing to sign a longer lease, pay several months upfront, or if the property has been on the market for a while. Our agents can help you negotiate favorable terms." },
      { q: "What is the difference between co-living and traditional renting?", a: "Co-living spaces offer furnished, shared living arrangements with included utilities and amenities. They're typically more affordable than traditional rentals and come with a built-in community. Traditional renting gives you more privacy and control over your living space." },
    ],
  },
  {
    title: "General",
    items: [
      { q: "Do you offer virtual property tours?", a: "Some listings may include photos, videos, or virtual walkthroughs. For the rest, our team can help coordinate a physical visit." },
      { q: "How can I contact an agent?", a: "You can reach our agents through the contact form on any property listing, by calling our office at +91 98765 43210, or by visiting our Contact page. Our team is available Monday through Saturday." },
      { q: "Are your property listings up to date?", a: "We try to keep listings updated and review owner submissions before approval. Availability can still change quickly, especially in active rental markets." },
    ],
  },
];

export default function FAQ() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Page Header */}
      <section className="bg-[#0f172a] py-16">
        <div className="container text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Frequently Asked Questions</h1>
          <p className="text-gray-400">
            <Link href="/"><span className="hover:text-primary transition-colors">Home</span></Link>
            <span className="mx-2">/</span>
            <span className="text-primary">FAQ</span>
          </p>
        </div>
      </section>

      <section className="section-padding bg-gray-50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Find Answers to <span className="text-primary">Common Questions</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Browse through our frequently asked questions to find the information you need
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-10">
            {FAQ_CATEGORIES.map((category, catIdx) => (
              <div key={catIdx}>
                <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center text-sm font-bold">
                    {catIdx + 1}
                  </span>
                  {category.title}
                </h3>
                <Accordion type="single" collapsible className="space-y-3">
                  {category.items.map((faq, i) => (
                    <AccordionItem
                      key={i}
                      value={`cat-${catIdx}-faq-${i}`}
                      className="bg-white rounded-xl border border-gray-100 px-6 shadow-sm"
                    >
                      <AccordionTrigger className="text-left font-semibold text-foreground hover:text-primary py-5">
                        {faq.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                        {faq.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>

          {/* Still have questions? */}
          <div className="max-w-3xl mx-auto mt-16 text-center bg-white rounded-2xl p-10 border border-gray-100 shadow-sm">
            <h3 className="text-2xl font-bold text-foreground mb-3">Still Have Questions?</h3>
            <p className="text-muted-foreground mb-6">
              Can't find the answer you're looking for? Our team is here to help.
            </p>
            <Link href="/contact">
              <Button className="bg-primary hover:bg-primary/90 text-white font-semibold px-8 gap-2">
                Contact Us <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
