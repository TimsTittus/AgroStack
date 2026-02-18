import React from 'react'
import FarmerOverview from './overview/page'
import { TalkToAgent } from "./_components/TalkToAgent";

function page() {
  return (
    <div className="flex-1 p-6 md:p-8">
      <FarmerOverview />
      <TalkToAgent />
    </div>
  )
}

export default page