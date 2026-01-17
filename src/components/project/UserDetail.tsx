"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/lib/store/hooks";
import ProfessionalProfileHeader from "@/components/project/ProfessionalProfileHeader";
import ReviewContent from "@/components/project/ReviewContent";
import { businessProfile, ViewProfile } from "@/lib/api/UserApi";
import { useParams } from "next/navigation";

const ProfessionalProfilePage = () => {
  const dispatch = useAppDispatch();
  const { id } = useParams<{ id: string }>();
  useEffect(() => {
    dispatch(ViewProfile());
  }, [dispatch]);
  useEffect(() => {
    if (id) {
      dispatch(businessProfile(id));
    }
  }, [id, dispatch]);

  return (
    <div className="w-full">
      <div className="bg-mintUltraLight rounded-[16px]">
        <ProfessionalProfileHeader />
        <div className="mt-[20px]">
          <ReviewContent showTitle showFilter={false} businessId={id} />
        </div>
      </div>
    </div>
  );
};

export default ProfessionalProfilePage;
