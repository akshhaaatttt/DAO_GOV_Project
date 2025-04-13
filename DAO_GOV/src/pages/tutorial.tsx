import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Tutorial = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8">DAO Governance Tutorial</h1>
      
      <div className="grid gap-8">
        {/* Video Section */}
        <Card>
          <CardHeader>
            <CardTitle>Getting Started with DAO Governance</CardTitle>
            <CardDescription>Learn how to participate in DAO governance effectively</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="aspect-video w-full max-w-4xl mx-auto mb-4">
              <iframe
                className="w-full h-full rounded-lg"
                src="https://www.youtube.com/embed/YOUR_VIDEO_ID"
                title="DAO Governance Tutorial"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Key Topics Covered:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Understanding DAO Governance</li>
                <li>How to Create and Vote on Proposals</li>
                <li>Best Practices for Participation</li>
                <li>Understanding Voting Power and Staking</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Additional Resources */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Resources</CardTitle>
            <CardDescription>Expand your knowledge with these helpful resources</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold">Documentation</h3>
                  <p className="text-sm text-gray-500">Detailed guides and API documentation</p>
                </div>
                <Button variant="outline">View Docs</Button>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold">Community Forum</h3>
                  <p className="text-sm text-gray-500">Join discussions with other DAO members</p>
                </div>
                <Button variant="outline">Join Forum</Button>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold">FAQ</h3>
                  <p className="text-sm text-gray-500">Common questions and answers</p>
                </div>
                <Button variant="outline">View FAQ</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Tutorial;
