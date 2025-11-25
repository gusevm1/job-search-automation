import { HeroSection } from "@/components/dashboard/hero-section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Search, Target } from "lucide-react";

export default function Dashboard() {
  const features = [
    {
      icon: FileText,
      title: "CV Analysis",
      description: "Upload your CV and let AI extract your skills and experience automatically.",
    },
    {
      icon: Search,
      title: "Smart Job Matching",
      description: "Find opportunities that match your profile across multiple job boards.",
    },
    {
      icon: Target,
      title: "Application Tracking",
      description: "Keep track of all your applications and interview schedules in one place.",
    },
  ];

  return (
    <div className="space-y-0">
      {/* Hero Section */}
      <HeroSection />

      {/* Features Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            How It Works
          </h2>
          <p className="text-muted-foreground">
            Three simple steps to accelerate your job search
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature, index) => (
            <Card key={feature.title}>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <feature.icon className="size-6" />
                  </div>
                  <div className="flex size-8 items-center justify-center rounded-full border border-primary/20 bg-primary/5 text-sm font-semibold text-primary">
                    {index + 1}
                  </div>
                </div>
                <CardTitle className="mt-4">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
