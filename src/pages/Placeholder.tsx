import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/PageHeader';

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader title={title} description="Coming next." />
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          This screen will be built in the next iteration.
        </CardContent>
      </Card>
    </div>
  );
}
