import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const BLUE = "#1675e2";
const BLUE_SOFT = "#e8f1fc";
const BORDER = "#e6e8eb";
const TEXT = "#0f1419";
const MUTED = "#6b7280";

const QUERY = "I'm looking for a tech journalist in the United Kingdom";

const MessageSquare = ({ size = 14, color = TEXT }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const DatabaseIcon = ({ size = 14, color = TEXT }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M3 5v14a9 3 0 0 0 18 0V5" /><path d="M3 12a9 3 0 0 0 18 0" />
  </svg>
);
const BellIcon = ({ size = 14, color = TEXT }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);
const PinIcon = ({ size = 14, color = TEXT, filled = false }: { size?: number; color?: string; filled?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : "none"} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="17" x2="12" y2="22" /><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24z" />
  </svg>
);
const SearchIcon = ({ size = 14, color = MUTED }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const SendIcon = ({ size = 16, color = "#fff" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);
const CheckIcon = ({ size = 12, color = "#0F9D58" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const HeaderButton = ({ icon, label, active = false }: { icon: React.ReactNode; label: string; active?: boolean }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 6, padding: "6px 12px",
    border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 13, fontWeight: 500,
    color: TEXT, backgroundColor: active ? "#f1f3f5" : "#fff",
  }}>
    {icon}<span>{label}</span>
  </div>
);

const Cursor = ({ visible }: { visible: boolean }) => (
  <span style={{
    display: "inline-block", width: 2, height: "1.1em", backgroundColor: TEXT,
    marginLeft: 2, verticalAlign: "text-bottom", opacity: visible ? 1 : 0,
  }} />
);

export const ChatScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const TYPE_START = 20;
  const TYPE_END = 130;
  const SEND = 140;
  const USER_BUBBLE_IN = 145;
  const THINKING_IN = 165;
  const THINKING_OUT = 245;
  const ASSISTANT_IN = 250;
  const CARD_IN = 280;
  const SAVED_HIGHLIGHT = 340;
  const PIN_APPEAR = 360;

  const typedLen = Math.floor(
    interpolate(frame, [TYPE_START, TYPE_END], [0, QUERY.length], {
      extrapolateLeft: "clamp", extrapolateRight: "clamp",
    })
  );
  const typedText = QUERY.slice(0, typedLen);
  const cursorVisible = Math.floor(frame / 15) % 2 === 0;

  const userBubbleSpring = spring({
    frame: frame - USER_BUBBLE_IN, fps, config: { damping: 18, stiffness: 180 },
  });
  const userBubbleOpacity = interpolate(userBubbleSpring, [0, 1], [0, 1]);
  const userBubbleY = interpolate(userBubbleSpring, [0, 1], [12, 0]);

  const inputCleared = frame >= SEND;

  const thinkingVisible = frame >= THINKING_IN && frame < THINKING_OUT;
  const dotPhase = (frame - THINKING_IN) / 8;

  const aSpring = spring({ frame: frame - ASSISTANT_IN, fps, config: { damping: 20, stiffness: 160 } });
  const aOpacity = interpolate(aSpring, [0, 1], [0, 1]);
  const aY = interpolate(aSpring, [0, 1], [16, 0]);

  const cardSpring = spring({ frame: frame - CARD_IN, fps, config: { damping: 18, stiffness: 140 } });
  const cardOpacity = interpolate(cardSpring, [0, 1], [0, 1]);
  const cardY = interpolate(cardSpring, [0, 1], [24, 0]);

  const savedPulse = interpolate(
    frame, [SAVED_HIGHLIGHT, SAVED_HIGHLIGHT + 20, SAVED_HIGHLIGHT + 60], [0, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const savedBg = `rgba(22, 117, 226, ${savedPulse * 0.12})`;

  const pinSpring = spring({ frame: frame - PIN_APPEAR, fps, config: { damping: 12, stiffness: 200 } });
  const pinScale = interpolate(pinSpring, [0, 1], [0.3, 1]);
  const pinOpacity = interpolate(pinSpring, [0, 1], [0, 1]);

  const floatY = Math.sin(frame / 50) * 3;

  return (
    <AbsoluteFill style={{ fontFamily, backgroundColor: "transparent", padding: 40 }}>
      <div style={{
        width: "100%", height: "100%",
        backgroundColor: "#fff", borderRadius: 16,
        boxShadow: "0 30px 80px rgba(15,20,25,0.18), 0 8px 20px rgba(15,20,25,0.08)",
        overflow: "hidden",
        display: "flex", flexDirection: "column",
        transform: `translateY(${floatY}px)`,
        border: `1px solid ${BORDER}`,
      }}>
        <div style={{
          height: 56, borderBottom: `1px solid ${BORDER}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 18px", flexShrink: 0, backgroundColor: "#fff",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8, backgroundColor: BLUE,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: 700, fontSize: 14,
            }}>M</div>
            <span style={{ fontWeight: 600, fontSize: 15, color: TEXT, letterSpacing: -0.2 }}>
              Media AI
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <HeaderButton icon={<MessageSquare color={BLUE} />} label="Chat" active />
            <HeaderButton icon={<DatabaseIcon />} label="Database" />
            <HeaderButton icon={<BellIcon />} label="Monitor" />
            <div style={{
              width: 32, height: 32, borderRadius: 999, backgroundColor: "#eef0f3",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 600, color: TEXT, marginLeft: 4,
            }}>JD</div>
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
          <div style={{
            width: 280, borderRight: `1px solid ${BORDER}`,
            backgroundColor: "#fafbfc", display: "flex", flexDirection: "column",
          }}>
            <div style={{
              padding: "14px 18px", borderBottom: `1px solid ${BORDER}`,
              fontSize: 11, fontWeight: 600, color: MUTED,
              textTransform: "uppercase", letterSpacing: 0.6,
            }}>
              Saved searches
            </div>
            <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 4 }}>
              <SidebarItem icon={<SearchIcon />} label="Climate reporters in EU" />
              <SidebarItem icon={<SearchIcon />} label="AI startup founders" />
              <SidebarItem icon={<SearchIcon />} label="Fashion editors NYC" />

              {frame >= SAVED_HIGHLIGHT && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "9px 10px", borderRadius: 8,
                  backgroundColor: savedBg,
                  transition: "none",
                  border: `1px solid ${savedPulse > 0.05 ? BLUE : "transparent"}`,
                }}>
                  <div style={{
                    transform: `scale(${pinScale})`, opacity: pinOpacity,
                    display: "flex", alignItems: "center",
                  }}>
                    <PinIcon color={BLUE} filled />
                  </div>
                  <span style={{
                    fontSize: 13, color: TEXT, fontWeight: 500,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    Tech journalist · UK
                  </span>
                </div>
              )}
            </div>
          </div>

          <div style={{
            flex: 1, display: "flex", flexDirection: "column", minWidth: 0,
            backgroundColor: "#fff",
          }}>
            <div style={{
              flex: 1, padding: "32px 56px 20px", overflow: "hidden",
              display: "flex", flexDirection: "column", gap: 20,
            }}>
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 13, color: MUTED, marginBottom: 4 }}>Today</div>
                <div style={{ fontSize: 22, fontWeight: 600, color: TEXT, letterSpacing: -0.4 }}>
                  Who do you want to reach today?
                </div>
              </div>

              {frame >= USER_BUBBLE_IN && (
                <div style={{
                  alignSelf: "flex-end",
                  opacity: userBubbleOpacity,
                  transform: `translateY(${userBubbleY}px)`,
                  maxWidth: "70%",
                  backgroundColor: BLUE,
                  color: "#fff",
                  padding: "12px 18px",
                  borderRadius: "18px 18px 4px 18px",
                  fontSize: 15, fontWeight: 500, lineHeight: 1.4,
                  boxShadow: "0 4px 14px rgba(22,117,226,0.25)",
                }}>
                  {QUERY}
                </div>
              )}

              {thinkingVisible && (
                <div style={{
                  alignSelf: "flex-start", display: "flex", gap: 5,
                  padding: "14px 18px", backgroundColor: "#f3f5f7", borderRadius: 16,
                }}>
                  {[0, 1, 2].map((i) => {
                    const o = 0.3 + 0.7 * Math.abs(Math.sin((dotPhase - i * 0.4)));
                    return (
                      <div key={i} style={{
                        width: 8, height: 8, borderRadius: 999,
                        backgroundColor: MUTED, opacity: o,
                      }} />
                    );
                  })}
                </div>
              )}

              {frame >= ASSISTANT_IN && (
                <div style={{
                  alignSelf: "flex-start", maxWidth: "78%",
                  opacity: aOpacity, transform: `translateY(${aY}px)`,
                  fontSize: 15, color: TEXT, lineHeight: 1.5,
                }}>
                  Found <span style={{ fontWeight: 600, color: BLUE }}>1,284</span> tech journalists in the United Kingdom. Here's a top match:
                </div>
              )}

              {frame >= CARD_IN && (
                <div style={{
                  alignSelf: "flex-start", maxWidth: 560, width: "100%",
                  opacity: cardOpacity, transform: `translateY(${cardY}px)`,
                  backgroundColor: "#fff", border: `1px solid ${BORDER}`,
                  borderRadius: 14, padding: 20,
                  boxShadow: "0 8px 22px rgba(15,20,25,0.06)",
                  display: "flex", flexDirection: "column", gap: 12,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 999,
                      background: "linear-gradient(135deg,#1675e2,#4ea3f0)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", fontWeight: 700, fontSize: 17,
                    }}>SK</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 16, fontWeight: 600, color: TEXT }}>
                        Sarah Kingsley
                      </div>
                      <div style={{ fontSize: 13, color: MUTED, marginTop: 2 }}>
                        Senior Tech Reporter · The Guardian · London, UK
                      </div>
                    </div>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "5px 10px", borderRadius: 999,
                      backgroundColor: "#e8f7ee", color: "#0F9D58",
                      fontSize: 11, fontWeight: 600,
                    }}>
                      <CheckIcon />Verified email
                    </div>
                  </div>
                  <div style={{
                    display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12,
                    paddingTop: 12, borderTop: `1px solid ${BORDER}`,
                  }}>
                    <Stat label="Beat" value="AI · Startups" />
                    <Stat label="Articles / mo" value="14" />
                    <Stat label="Reply rate" value="38%" />
                  </div>
                </div>
              )}
            </div>

            <div style={{
              borderTop: `1px solid ${BORDER}`, padding: "16px 56px 24px",
              backgroundColor: "#fff",
            }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                border: `1.5px solid ${frame >= TYPE_START && frame < SEND ? BLUE : BORDER}`,
                borderRadius: 14, padding: "12px 14px",
                boxShadow: frame >= TYPE_START && frame < SEND
                  ? `0 0 0 4px ${BLUE_SOFT}` : "none",
                backgroundColor: "#fff",
              }}>
                <div style={{
                  flex: 1, fontSize: 15, color: TEXT, minHeight: 22,
                  whiteSpace: "nowrap", overflow: "hidden",
                }}>
                  {inputCleared ? (
                    <span style={{ color: MUTED }}>Ask anything…</span>
                  ) : typedText.length === 0 ? (
                    <><span style={{ color: MUTED }}>Ask anything…</span><Cursor visible={cursorVisible} /></>
                  ) : (
                    <>{typedText}<Cursor visible={cursorVisible} /></>
                  )}
                </div>
                <button style={{
                  border: "none", outline: "none",
                  width: 36, height: 36, borderRadius: 10,
                  backgroundColor: typedText.length > 0 || inputCleared ? BLUE : "#cfd4d9",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                }}>
                  <SendIcon />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const SidebarItem = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 8,
    padding: "9px 10px", borderRadius: 8,
    fontSize: 13, color: TEXT, fontWeight: 400,
  }}>
    {icon}
    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
      {label}
    </span>
  </div>
);

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div>
    <div style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 600 }}>
      {label}
    </div>
    <div style={{ fontSize: 14, color: TEXT, fontWeight: 600, marginTop: 3 }}>
      {value}
    </div>
  </div>
);
