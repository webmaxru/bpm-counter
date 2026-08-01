const AMAZON_ASSOCIATE_TAG = 'webapplication-20';

export const affiliateCampaigns = Object.freeze({
  'studio-headphones': Object.freeze({
    id: 'amazon-studio-headphones',
    creativeId: 'studio-headphones-v1',
    network: 'amazon-associates',
    merchant: 'Amazon',
    destinationHost: 'www.amazon.com',
    href: `https://www.amazon.com/s?k=closed-back+studio+headphones&tag=${AMAZON_ASSOCIATE_TAG}`,
    title: 'Hear the beat clearly',
    description:
      'Compare closed-back studio headphones for cueing, production, and practice.',
    callToAction: 'Browse studio headphones',
  }),
  'dj-controllers': Object.freeze({
    id: 'amazon-dj-controllers',
    creativeId: 'dj-controllers-v1',
    network: 'amazon-associates',
    merchant: 'Amazon',
    destinationHost: 'www.amazon.com',
    href: `https://www.amazon.com/s?k=dj+controllers&tag=${AMAZON_ASSOCIATE_TAG}`,
    title: 'Build a hands-on DJ setup',
    description:
      'Compare DJ controllers for learning beatmatching, cueing, and live mixing.',
    callToAction: 'Browse DJ controllers',
  }),
});

export function getAffiliateCampaign(campaignId) {
  const campaign = affiliateCampaigns[campaignId];

  if (!campaign) {
    throw new Error(`Unknown affiliate campaign: ${campaignId}`);
  }

  return campaign;
}
