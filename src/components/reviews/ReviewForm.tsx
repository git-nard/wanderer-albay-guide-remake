import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Star } from "lucide-react";

interface ReviewFormProps {
  spotId: string;
  userId: string;
  onReviewSubmitted: () => void;
  hasUserReviewed: boolean;
}

export const ReviewForm = ({ spotId, userId, onReviewSubmitted, hasUserReviewed }: ReviewFormProps) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast({
        title: "Error",
        description: "Please select a rating",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.from("reviews").insert({
      spot_id: spotId,
      user_id: userId,
      rating,
      comment: comment.trim() || null,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to submit review",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Review submitted successfully",
      });
      setRating(0);
      setComment("");
      onReviewSubmitted();
    }

    setIsSubmitting(false);
  };
  


  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Your Rating</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`w-8 h-8 ${
                  star <= (hoveredRating || rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Your Review (Optional)</label>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience..."
          rows={4}
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground mt-1">
          {comment.length}/500 characters
        </p>
      </div>

      <Button
  type="submit"
  disabled={isSubmitting || rating === 0 || hasUserReviewed}
>
  {hasUserReviewed
    ? "Already Reviewed"
    : isSubmitting
    ? "Submitting..."
    : "Submit Review"}
</Button>

    </form>
  );
};