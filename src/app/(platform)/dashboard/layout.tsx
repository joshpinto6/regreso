import { Onborda, OnbordaProvider } from "onborda";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <OnbordaProvider>
      <Onborda
        steps={[
          {
            tour: "welcome-tour",
            steps: [
              {
                icon: <>👋</>,
                title: "Tour 1, Step 1",
                content: <>First tour, first step</>,
                selector: "#welcome-card",
                side: "top",
                showControls: true,
                pointerPadding: 10,
                pointerRadius: 10,
              },
            ],
          },
        ]}
      >
        {children}
      </Onborda>
    </OnbordaProvider>
  );
}
