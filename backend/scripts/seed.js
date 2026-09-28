import mongoose from 'mongoose';
import dotenv from 'dotenv';
import College from '../models/College.js';
import User from '../models/User.js';
import CommunityGroup from '../models/CommunityGroup.js';

dotenv.config();

const GROUPS = [
  {
    name: 'Academic Stress',
    description: 'A peer space for exam pressure, assignments, deadlines, and academic overwhelm.',
    category: 'Academics',
    tags: ['stress', 'exams', 'study', 'grades'],
    icon: '📚',
    rules: [
      'Share support, not graded answers.',
      'Be kind about academic setbacks.',
      'Use trigger warnings for panic or burnout spirals.'
    ]
  },
  {
    name: 'Anxiety & Stress',
    description: 'Peer support for racing thoughts, worry, and learning to regulate together.',
    category: 'Wellbeing',
    tags: ['anxiety', 'stress', 'panic', 'coping'],
    icon: '🌊',
    rules: [
      'Do not give medical diagnoses.',
      'Offer coping ideas, not commands.',
      'Flag crisis content instead of amplifying it.'
    ]
  },
  {
    name: 'Sleep',
    description: 'Talk about insomnia, rest, night-time rumination, and sleep routines.',
    category: 'Wellbeing',
    tags: ['sleep', 'insomnia', 'rest', 'routine'],
    icon: '🌙',
    rules: [
      'Avoid shaming late-night habits.',
      'Share what helped you, not one-size-fits-all advice.'
    ]
  },
  {
    name: 'Relationships',
    description: 'Navigate friendships, dating, family pressure, and social anxiety at college.',
    category: 'Social',
    tags: ['relationships', 'friends', 'dating', 'loneliness'],
    icon: '🤝',
    rules: [
      'No identifying other students by name.',
      'Respect privacy. This is not a gossip board.'
    ]
  },
  {
    name: 'College Life',
    description: 'Homesickness, campus adjustment, identity, and the everyday student experience.',
    category: 'Campus',
    tags: ['college', 'adjustment', 'campus', 'identity'],
    icon: '🏫',
    rules: [
      'Keep conversation peer-support focused.',
      'Avoid unsolicited DMs or swapping personal contact details.'
    ]
  },
  {
    name: 'Self Confidence',
    description: 'A space to talk about self-worth, comparison, and rebuilding confidence.',
    category: 'Wellbeing',
    tags: ['confidence', 'self-esteem', 'comparison'],
    icon: '🌟',
    rules: [
      'Encourage without toxic positivity.',
      'Do not mock appearance or personal traits.'
    ]
  },
  {
    name: 'General Wellbeing',
    description: 'An open peer-support group for everyday mental health and mindfulness.',
    category: 'Wellbeing',
    tags: ['mindfulness', 'wellbeing', 'general', 'support'],
    icon: '🌱',
    rules: [
      'Assume good intent.',
      'Use anonymity if you need it.',
      'Seek professional help for clinical advice.'
    ]
  }
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mental-health-platform');
    console.log('✅ Connected to MongoDB');

    let college = await College.findOne({ code: 'DEFAULT' });

    if (!college) {
      college = await College.create({
        name: 'Default College',
        code: 'DEFAULT',
        description: 'Default college created by seeding script',
        isActive: true
      });
      console.log('✅ Created default college:', college.name);
    } else {
      console.log('ℹ️  Default college already exists:', college.name);
    }

    let admin = await User.findOne({ role: 'admin' });

    if (!admin) {
      admin = await User.create({
        name: 'Admin User',
        email: 'admin@default.com',
        password: 'admin123',
        role: 'admin',
        collegeId: college._id,
        alias: 'Admin',
        isActive: true
      });
      console.log('✅ Created default admin user:', admin.email);
      console.log('   Password: admin123');
    } else {
      console.log('ℹ️  Admin user already exists:', admin.email);
    }

    for (const g of GROUPS) {
      const exists = await CommunityGroup.findOne({ name: g.name, collegeId: college._id });
      if (!exists) {
        await CommunityGroup.create({
          ...g,
          collegeId: college._id,
          moderatorIds: [admin._id]
        });
        console.log(`✅ Created group: ${g.name}`);
      } else {
        console.log(`ℹ️  Group already exists: ${g.name}`);
      }
    }

    console.log('\n✅ Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();
