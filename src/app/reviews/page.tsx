"use client"; // Ensures this is a client-side component

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Star from "@/components/ui/star";

import { getFirestore, collection, addDoc } from "firebase/firestore";
import { app } from "@/services/firebaseConfig";

// Zod schema for form validation
const reviewSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  reviewText: z.string().min(10, "Review must be at least 10 characters"),
});

type ReviewForm = z.infer<typeof reviewSchema>;

const ReviewsPage = ({ companyName }: { companyName: string }) => {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ReviewForm>({
    resolver: zodResolver(reviewSchema),
  });

  const db = getFirestore(app);

  const onSubmit = async (data: ReviewForm) => {
    if (rating === 0) {
      alert("Please select a rating before submitting.");
      return;
    }

    try {
      const reviewData = {
        ...data,
        rating,
        companyName,
        timestamp: new Date(),
      };

      const docRef = await addDoc(collection(db, "reviews"), reviewData);
      console.log("Review submitted with ID:", docRef.id);
      alert("Review submitted successfully!");
      reset();
      setRating(0);
    } catch (error) {
      console.error("Error adding review:", error);
      alert("Failed to submit review. Please try again.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-semibold text-center mb-6">
          Review for {companyName}
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium">
              Username:
            </label>
            <input
              id="username"
              type="text"
              {...register("username")}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your username"
            />
            {errors.username && (
              <p className="text-red-500 text-sm mt-1">
                {errors.username.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="reviewText" className="block text-sm font-medium">
              Review:
            </label>
            <textarea
              id="reviewText"
              {...register("reviewText")}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Write your review"
            />
            {errors.reviewText && (
              <p className="text-red-500 text-sm mt-1">
                {errors.reviewText.message}
              </p>
            )}
          </div>

          <div>
            <p className="text-sm font-medium">Rate your experience:</p>
            <div className="flex justify-center space-x-2 mb-2">
              {Array.from({ length: 5 }, (_, index) => (
                <Star
                  key={index}
                  filled={index + 1 <= (hoverRating || rating)}
                  onClick={() => setRating(index + 1)}
                  onMouseEnter={() => setHoverRating(index + 1)}
                  onMouseLeave={() => setHoverRating(0)}
                />
              ))}
            </div>
            {rating === 0 && (
              <p className="text-red-500 text-sm text-center">
                Please select a rating.
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Submit Review
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReviewsPage;
