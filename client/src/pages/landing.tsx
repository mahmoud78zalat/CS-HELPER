import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Headphones, Users, MessageSquare } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Headphones className="text-white text-lg" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">BFL Customer Service Helper</h1>
                <p className="text-sm text-slate-600">Internal Customer Service Management Tool</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-800 mb-4">
            Streamline Your Customer Service Operations
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            Efficiently manage customer information, create internal communications, 
            and access reply templates with our comprehensive customer service platform.
          </p>

          <Button 
            onClick={() => window.location.href = '/api/login'}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-lg hover:shadow-lg transition-all duration-200 text-lg"
          >
            Sign In to Get Started
          </Button>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <Card className="border border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  <span>Customer Management</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Centralized customer information management with auto-save functionality
                  and order conversion tools.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5 text-purple-500" />
                  <span>Template System</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Instant access to reply templates with variable replacement
                  and one-click copy functionality.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Headphones className="h-5 w-5 text-green-500" />
                  <span>Internal Communications</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Create and manage internal team communications with proper
                  escalation workflows.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
