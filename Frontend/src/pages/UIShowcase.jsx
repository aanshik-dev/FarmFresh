import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { useTheme } from "../context/ThemeContext";
import {
  Button,
  Input,
  Modal,
  Loader,
  useToast,
  AuthButtons,
} from "../components/ui";

const Section = ({ title, description, isDark, children }) => (
  <section
    className={`rounded-2xl border p-6 sm:p-8 space-y-6 ${
      isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
    }`}
  >
    <div>
      <h2
        className={`text-xs uppercase tracking-widest font-semibold ${isDark ? "text-emerald-400" : "text-emerald-600"}`}
      >
        {title}
      </h2>
      {description && (
        <p
          className={`text-sm mt-1.5 ${isDark ? "text-slate-500" : "text-slate-500"}`}
        >
          {description}
        </p>
      )}
    </div>
    {children}
  </section>
);

const SubLabel = ({ children, isDark }) => (
  <p
    className={`text-xs uppercase tracking-wider font-medium mb-3 ${isDark ? "text-slate-500" : "text-slate-400"}`}
  >
    {children}
  </p>
);

const UIShowcase = () => {
  const { isDark } = useTheme();
  const { toast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [emailVal, setEmailVal] = useState("");

  return (
    <div
      className={`min-h-screen w-full pt-28 sm:pt-32 pb-20 px-6 sm:px-10 lg:px-20 transition-colors duration-300 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
    >
      <div className="max-w-5xl mx-auto space-y-10">
        <div className="space-y-2">
          <h1
            className={`font-display text-3xl sm:text-4xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
          >
            UI Component Library
          </h1>
          <p
            className={`text-sm sm:text-base ${isDark ? "text-slate-400" : "text-slate-500"}`}
          >
            Every reusable building block in FarmFresh
          </p>
        </div>

        <Section
          title="Buttons"
          description="Primary actions, variants, sizes and states."
          isDark={isDark}
        >
          <div>
            <SubLabel isDark={isDark}>Variants</SubLabel>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
            </div>
          </div>

          <div>
            <SubLabel isDark={isDark}>Sizes</SubLabel>
            <div className="flex flex-wrap gap-3 items-center">
              <Button size="sm" variant="primary">
                Small
              </Button>
              <Button size="md" variant="primary">
                Medium
              </Button>
              <Button size="lg" variant="primary">
                Large
              </Button>
            </div>
          </div>

          <div>
            <SubLabel isDark={isDark}>States &amp; icons</SubLabel>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" icon="ph:plant-fill">
                With Icon
              </Button>
              <Button variant="outline" iconRight="ph:arrow-right">
                Next Step
              </Button>
              <Button variant="primary" loading>
                Saving…
              </Button>
              <Button variant="primary" disabled>
                Disabled
              </Button>
            </div>
          </div>

          <div>
            <SubLabel isDark={isDark}>Toast triggers</SubLabel>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="primary"
                onClick={() =>
                  toast.success("Partner registered!", { title: "Success" })
                }
              >
                Fire Success Toast
              </Button>
              <Button
                variant="danger"
                onClick={() =>
                  toast.error("Something went wrong.", { title: "Error" })
                }
              >
                Fire Error Toast
              </Button>
              <Button
                variant="outline"
                onClick={() => toast.warning("Harvest data is stale.")}
              >
                Fire Warning Toast
              </Button>
              <Button
                variant="ghost"
                onClick={() => toast.info("Sync complete.")}
              >
                Fire Info Toast
              </Button>
            </div>
          </div>
        </Section>

        <Section
          title="Auth Buttons"
          description="Login and signup actions used in the navbar."
          isDark={isDark}
        >
          <AuthButtons isDark={isDark} />
        </Section>

        <Section
          title="Inputs"
          description="Text fields with labels, icons, hints and validation."
          isDark={isDark}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input
              label="Farmer Name"
              placeholder="e.g. Debendra Semwal"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              icon="ph:user-fill"
              hint="Enter the lead farmer's full name"
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="farmer@example.in"
              value={emailVal}
              onChange={(e) => setEmailVal(e.target.value)}
              icon="ph:envelope-fill"
              error={
                emailVal && !emailVal.includes("@")
                  ? "Enter a valid email address"
                  : ""
              }
              required
            />
            <Input
              label="Phone Number"
              type="tel"
              placeholder="+91 99999 00000"
              icon="ph:phone-fill"
            />
            <Input
              label="Disabled field"
              placeholder="Cannot be edited"
              disabled
              value="Zone D — High Alpine"
            />
          </div>
        </Section>

        <Section
          title="Modals"
          description="Accessible dialogs with focus trapping and Escape to close."
          isDark={isDark}
        >
          <div className="flex gap-3 flex-wrap">
            <Button variant="primary" onClick={() => setModalOpen(true)}>
              Open Info Modal
            </Button>
            <Button variant="danger" onClick={() => setConfirmOpen(true)}>
              Open Confirm Modal
            </Button>
          </div>

          <Modal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Harvest Status Update"
            size="md"
          >
            <p>
              The Triyuginarayan Organic Pulse Pioneers group has marked their
              Rajma harvest as{" "}
              <strong className="text-emerald-400">Ready for Collection</strong>
              . A coordinator will be assigned within 24 hours.
            </p>
            <p
              className={`mt-3 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
            >
              Last updated: 2 hours ago · Zone C · 2,200m altitude
            </p>
          </Modal>

          <Modal
            isOpen={confirmOpen}
            onClose={() => setConfirmOpen(false)}
            title="Remove Farmer Group"
            size="sm"
            footer={
              <>
                <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    setConfirmOpen(false);
                    toast.error("Group removed.");
                  }}
                >
                  Remove
                </Button>
              </>
            }
          >
            <p>
              Are you sure you want to remove{" "}
              <strong className={isDark ? "text-white" : "text-slate-900"}>
                Mandal Valley Growers
              </strong>{" "}
              from the collective? This action cannot be undone.
            </p>
          </Modal>
        </Section>

        <Section
          title="Loaders"
          description="Spinners, dots, progress bars and skeleton placeholders."
          isDark={isDark}
        >
          <div>
            <SubLabel isDark={isDark}>Spinner &amp; dots</SubLabel>
            <div className="flex flex-wrap gap-10 items-center">
              <div className="flex flex-col items-center gap-2">
                <Loader
                  variant="spinner"
                  size="md"
                  labelVisible
                  label="Spinner"
                />
              </div>
              <div className="flex flex-col items-center gap-2">
                <Loader variant="dots" size="md" labelVisible label="Dots" />
              </div>
              <div className="flex flex-col w-40 gap-2">
                <Loader variant="bar" />
                <span
                  className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
                >
                  bar
                </span>
              </div>
            </div>
          </div>
          <div>
            <SubLabel isDark={isDark}>Skeleton</SubLabel>
            <Loader variant="skeleton" lines={3} avatar />
          </div>
        </Section>

    
      </div>
    </div>
  );
};

export default UIShowcase;
