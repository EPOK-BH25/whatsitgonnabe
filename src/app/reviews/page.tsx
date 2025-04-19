"use client"; // Ensure this file is treated as a client component

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Star from "@/components/ui/star"; // Corrected import without curly braces

// Schema for the review form (e.g., including username and rating)
const reviewSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  reviewText: z.string().min(10, "Review must be at least 10 characters"),
  rating: z.number().min(1, "Rating must be between 1 and 5").max(5),
});

const ReviewsPage = ({ companyName }: { companyName: string }) => {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(reviewSchema),
  });

  const handleStarClick = (value: number) => {
    setRating(value);
  };

  const handleMouseEnter = (value: number) => {
    setHoverRating(value);
  };

  const handleMouseLeave = () => {
    setHoverRating(0);
  };

  const onSubmit = (data: any) => {
    // Handle form submission, e.g., send data to Firebase
    console.log("Review submitted:", { ...data, rating, companyName });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        {/* Display the company name at the top */}
        <h1 className="text-2xl font-semibold text-center mb-6">{companyName}</h1>

        {/* Review Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="input-group">
            <label htmlFor="username" className="block text-sm font-medium">Username:</label>
            <input
              id="username"
              type="text"
              {...register("username")}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your username"
            />
            {errors.username && <span className="text-red-500 text-sm">{errors.username.message}</span>}
          </div>

          <div className="input-group">
            <label htmlFor="reviewText" className="block text-sm font-medium">Review:</label>
            <textarea
              id="reviewText"
              {...register("reviewText")}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Write your review"
            />
            {errors.reviewText && <span className="text-red-500 text-sm">{errors.reviewText.message}</span>}
          </div>

          <div className="input-group">
            <p className="text-sm font-medium">Rate your experience:</p>
            <div className="flex justify-center space-x-2">
              {Array.from({ length: 5 }, (_, index) => (
                <Star
                  key={index}
                  filled={index + 1 <= (hoverRating || rating)}
                  onClick={() => handleStarClick(index + 1)}
                  onMouseEnter={() => handleMouseEnter(index + 1)}
                  onMouseLeave={handleMouseLeave}
                />
              ))}
            </div>
            {rating === 0 && <span className="text-red-500 text-sm">Please select a rating.</span>}
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
