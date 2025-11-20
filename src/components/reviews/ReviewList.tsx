import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_id: string;
  user_name: string;
}

interface ReviewListProps {
  currentUserId: string | null;
  reviews: Review[];
  isLoading: boolean;
  fetchReviews: () => void;
}

export const ReviewList = ({
  currentUserId,
  reviews,
  isLoading,
  fetchReviews,
}: ReviewListProps) => {
  const { toast } = useToast();

  const handleDeleteReview = async (reviewId: string) => {
    const { error } = await supabase.from("reviews").delete().eq("id", reviewId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete review",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Review deleted successfully",
      });
      fetchReviews(); // Refresh reviews after deletion
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        No reviews yet. Be the first to review!
      </p>
    );
  }

  const averageRating =
    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return (
    <div className="space-y-4">
      {/* Average Rating */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center gap-1">
          <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
          <span className="font-semibold text-lg">{averageRating.toFixed(1)}</span>
        </div>
        <span className="text-sm text-muted-foreground">
          ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
        </span>
      </div>

      {/* Review Cards */}
      {reviews.map((review) => (
        <Card key={review.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">{review.user_name}</span>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < review.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(review.created_at).toLocaleDateString()}
                </p>
              </div>

              {currentUserId === review.user_id && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteReview(review.id)}
                  className="text-destructive hover:text-destructive"
                >
                  Delete
                </Button>
              )}
            </div>
          </CardHeader>
          {review.comment && (
            <CardContent>
              <p className="text-sm">{review.comment}</p>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
};
