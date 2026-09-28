import mongoose from 'mongoose';
import dotenv from 'dotenv';
import College from './models/College.js';
import CommunityGroup from './models/CommunityGroup.js';
import Post from './models/Post.js';

dotenv.config();

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mental-health-platform');
    console.log('Connected to MongoDB');

    const colleges = await College.find({ isActive: true });
    if (!colleges.length) {
      console.log('No colleges found. Aborting.');
      process.exit(1);
    }

    for (const college of colleges) {
      let generalGroup = await CommunityGroup.findOne({
        collegeId: college._id,
        $or: [{ name: 'General Wellbeing' }, { name: 'General Support' }]
      });

      if (!generalGroup) {
        generalGroup = await CommunityGroup.create({
          name: 'General Wellbeing',
          description: 'A general space for students to discuss and support each other.',
          category: 'Wellbeing',
          tags: ['general', 'support'],
          icon: '🌱',
          collegeId: college._id
        });
        console.log(`Created General Wellbeing group for ${college.code || college.name}`);
      }

      const result = await Post.updateMany(
        {
          collegeId: college._id,
          $or: [{ groupId: { $exists: false } }, { groupId: null }]
        },
        {
          $set: {
            groupId: generalGroup._id,
            status: 'active',
            isTriggerWarning: false
          }
        }
      );
      console.log(`Assigned ${result.modifiedCount} posts in ${college.code || college.name} to ${generalGroup.name}`);
    }

    await Post.updateMany(
      { likes: { $exists: true }, supports: { $exists: false } },
      { $rename: { likes: 'supports' } }
    );

    console.log('Community post migration complete.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

migrate();
