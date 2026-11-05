/** Short, varied feedback lines for right and wrong answers */
const cheers = ['Nailed it!', 'Brilliant!', 'You got it!', 'Superb!', 'On fire!', 'Spot on!', 'Wonderful!']
const nudges = ['Almost!', 'So close!', 'Good try!', 'Not quite!']
export const randomCheer = () => cheers[Math.floor(Math.random() * cheers.length)]
export const randomNudge = () => nudges[Math.floor(Math.random() * nudges.length)]
