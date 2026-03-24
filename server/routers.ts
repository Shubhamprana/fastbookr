import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, protectedProcedure, router } from "./_core/trpc";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(() => {
      return {
        success: true,
      } as const;
    }),
  }),

  // Property routes
  properties: router({
    getAll: publicProcedure.query(async () => {
      const { getAllProperties } = await import('./db');
      return getAllProperties();
    }),

    getAdminAll: adminProcedure.query(async () => {
      const { getAdminProperties } = await import('./db');
      return getAdminProperties();
    }),

    getMine: protectedProcedure.query(async ({ ctx }) => {
      const { getOwnerProperties } = await import("./db");
      return getOwnerProperties(ctx.user.id);
    }),
    
    getFeatured: publicProcedure.query(async () => {
      const { getFeaturedProperties } = await import('./db');
      return getFeaturedProperties();
    }),
    
    getById: publicProcedure
      .input((val: unknown) => {
        if (typeof val !== 'object' || val === null || !('id' in val)) {
          throw new Error('Invalid input');
        }
        return val as { id: number };
      })
      .query(async ({ input, ctx }) => {
        const { getAdminPropertyById, getPropertyById } = await import('./db');
        const property = await getPropertyById(input.id);
        if (property) return property;
        if (ctx.user?.role === "admin") {
          return getAdminPropertyById(input.id);
        }
        return undefined;
      }),
    
    search: publicProcedure
      .input((val: unknown) => val as any)
      .query(async ({ input }) => {
        const { searchProperties } = await import('./db');
        return searchProperties(input);
      }),

    submitOwnerListing: protectedProcedure
      .input((val: unknown) => val as any)
      .mutation(async ({ input, ctx }) => {
        const { createOwnerListing } = await import("./db");
        const listing = await createOwnerListing({
          ...input,
          createdBy: ctx.user.id,
        });
        const { sendAdminAlert } = await import("./_core/email");
        await sendAdminAlert(
          `New owner listing submitted: ${listing.title}`,
          [
            `A new owner listing has been submitted for review.`,
            `Title: ${listing.title}`,
            `Owner: ${listing.ownerName || "Unknown"}`,
            `Email: ${listing.ownerEmail || "Not provided"}`,
            `Phone: ${listing.ownerPhone || "Not provided"}`,
            `City: ${listing.city}, ${listing.state}`,
          ].join("\n")
        );
        return listing;
      }),
    
    create: adminProcedure
      .input((val: unknown) => val as any)
      .mutation(async ({ input, ctx }) => {
        const { createProperty } = await import('./db');
        return createProperty({ ...input, createdBy: ctx.user.id });
      }),
    
    update: adminProcedure
      .input((val: unknown) => val as any)
      .mutation(async ({ input }) => {
        const { getAdminPropertyById, updateProperty } = await import('./db');
        const before = await getAdminPropertyById(input.id);
        const { id, ...data } = input;
        const updated = await updateProperty(id, data);

        if (
          before &&
          before.approvalStatus !== updated.approvalStatus &&
          updated.ownerEmail
        ) {
          const { sendEmail } = await import("./_core/email");
          await sendEmail({
            to: [{ email: updated.ownerEmail, name: updated.ownerName || "Owner" }],
            subject: `Listing ${updated.approvalStatus}: ${updated.title}`,
            textContent: [
              `Your listing status has been updated.`,
              `Title: ${updated.title}`,
              `New status: ${updated.approvalStatus}`,
              `City: ${updated.city}, ${updated.state}`,
            ].join("\n"),
          });
        }

        return updated;
      }),
    
    delete: adminProcedure
      .input((val: unknown) => {
        if (typeof val !== 'object' || val === null || !('id' in val)) {
          throw new Error('Invalid input');
        }
        return val as { id: number };
      })
      .mutation(async ({ input }) => {
        const { deleteProperty } = await import('./db');
        return deleteProperty(input.id);
      }),
  }),

  // Image upload
  upload: router({
    image: protectedProcedure
      .input((val: unknown) => val as { base64: string; filename: string; contentType: string })
      .mutation(async ({ input }) => {
        const { uploadPropertyImage } = await import('./db');
        const { nanoid } = await import('nanoid');
        const suffix = nanoid(8);
        const ext = input.filename.split('.').pop() || 'jpg';
        const key = `property-images/${Date.now()}-${suffix}.${ext}`;
        const buffer = Buffer.from(input.base64, 'base64');
        const { url } = await uploadPropertyImage(key, buffer, input.contentType);
        return { url };
      }),
  }),

  // Inquiry routes
  inquiries: router({
    create: publicProcedure
      .input((val: unknown) => val as any)
      .mutation(async ({ input }) => {
        const { createInquiry } = await import('./db');
        const { notifyOwner } = await import('./_core/notification');
        const { sendAdminAlert } = await import("./_core/email");
        
        const result = await createInquiry(input);
        
        // Notification is best-effort only. Inquiry creation should still succeed
        // when the local notification provider is not configured.
        try {
          await notifyOwner({
            title: `New Property Inquiry: ${input.name}`,
            content: `You have received a new inquiry for property ID ${input.propertyId}.\n\nFrom: ${input.name} (${input.email})\nPhone: ${input.phone || 'Not provided'}\n\nMessage: ${input.message}`,
          });
        } catch (error) {
          console.warn("[Inquiry] Notification skipped:", error);
        }

        await sendAdminAlert(
          `New property inquiry from ${input.name}`,
          [
            `Property ID: ${input.propertyId}`,
            `Name: ${input.name}`,
            `Email: ${input.email}`,
            `Phone: ${input.phone || "Not provided"}`,
            `Message: ${input.message}`,
          ].join("\n")
        );
        
        return result;
      }),
    
    getAll: adminProcedure
      .query(async () => {
        const { getAllInquiries } = await import('./db');
        return getAllInquiries();
      }),
    
    getByProperty: adminProcedure
      .input((val: unknown) => {
        if (typeof val !== 'object' || val === null || !('propertyId' in val)) {
          throw new Error('Invalid input');
        }
        return val as { propertyId: number };
      })
      .query(async ({ input }) => {
        const { getInquiriesByProperty } = await import('./db');
        return getInquiriesByProperty(input.propertyId);
      }),

    updateStatus: adminProcedure
      .input((val: unknown) => {
        if (
          typeof val !== "object" ||
          val === null ||
          !("id" in val) ||
          !("status" in val)
        ) {
          throw new Error("Invalid input");
        }
        return val as { id: number; status: "new" | "contacted" | "closed" };
      })
      .mutation(async ({ input }) => {
        const { updateInquiryStatus } = await import("./db");
        return updateInquiryStatus(input.id, input.status);
      }),
  }),

  ownerMessages: router({
    getMine: protectedProcedure.query(async ({ ctx }) => {
      const { getOwnerMessages } = await import("./db");
      return getOwnerMessages(ctx.user.id);
    }),

    getByProperty: protectedProcedure
      .input((val: unknown) => {
        if (typeof val !== "object" || val === null || !("propertyId" in val)) {
          throw new Error("Invalid input");
        }
        return val as { propertyId: number };
      })
      .query(async ({ input, ctx }) => {
        const { getOwnerProperties, getPropertyMessages } = await import("./db");
        if (ctx.user.role !== "admin") {
          const ownerProperties = await getOwnerProperties(ctx.user.id);
          const allowed = ownerProperties.some(property => property.id === input.propertyId);
          if (!allowed) {
            throw new Error("Unauthorized");
          }
        }
        return getPropertyMessages(input.propertyId);
      }),

    create: protectedProcedure
      .input((val: unknown) => {
        if (
          typeof val !== "object" ||
          val === null ||
          !("propertyId" in val) ||
          !("content" in val)
        ) {
          throw new Error("Invalid input");
        }
        return val as { propertyId: number; content: string };
      })
      .mutation(async ({ input, ctx }) => {
        const { createOwnerMessage, getOwnerProperties } = await import("./db");
        if (ctx.user.role !== "admin") {
          const ownerProperties = await getOwnerProperties(ctx.user.id);
          const allowed = ownerProperties.some(property => property.id === input.propertyId);
          if (!allowed) {
            throw new Error("Unauthorized");
          }
        }
        const message = await createOwnerMessage({
          propertyId: input.propertyId,
          senderRole: ctx.user.role === "admin" ? "admin" : "owner",
          content: input.content,
        });

        const { getAdminPropertyById } = await import("./db");
        const property = await getAdminPropertyById(input.propertyId);
        const { sendAdminAlert, sendEmail } = await import("./_core/email");

        if (ctx.user.role === "admin" && property?.ownerEmail) {
          await sendEmail({
            to: [{ email: property.ownerEmail, name: property.ownerName || "Owner" }],
            subject: `New admin message for ${property.title}`,
            textContent: input.content,
          });
        }

        if (ctx.user.role !== "admin") {
          await sendAdminAlert(
            `Owner replied for property #${input.propertyId}`,
            [
              `Property: ${property?.title || input.propertyId}`,
              `Owner: ${property?.ownerName || "Unknown"}`,
              `Owner email: ${property?.ownerEmail || "Not provided"}`,
              `Message: ${input.content}`,
            ].join("\n")
          );
        }

        return message;
      }),
  }),

  platformSettings: router({
    get: publicProcedure.query(async () => {
      const { getPlatformSettings } = await import("./db");
      return getPlatformSettings();
    }),

    update: adminProcedure
      .input((val: unknown) => {
        if (
          typeof val !== "object" ||
          val === null ||
          !("teamName" in val) ||
          !("tagline" in val) ||
          !("contactPhone" in val) ||
          !("contactEmail" in val)
        ) {
          throw new Error("Invalid input");
        }
        return val as {
          teamName: string;
          tagline: string;
          contactPhone: string;
          contactEmail: string;
        };
      })
      .mutation(async ({ input }) => {
        const { upsertPlatformSettings } = await import("./db");
        return upsertPlatformSettings(input);
      }),
  }),

  contactMessages: router({
    create: publicProcedure
      .input((val: unknown) => {
        if (
          typeof val !== "object" ||
          val === null ||
          !("name" in val) ||
          !("email" in val) ||
          !("message" in val)
        ) {
          throw new Error("Invalid input");
        }
        return val as {
          name: string;
          email: string;
          phone?: string;
          subject?: string;
          message: string;
        };
      })
      .mutation(async ({ input }) => {
        const { createContactMessage } = await import("./db");
        const message = await createContactMessage(input);
        const { sendAdminAlert } = await import("./_core/email");
        await sendAdminAlert(
          `New contact form message from ${input.name}`,
          [
            `Name: ${input.name}`,
            `Email: ${input.email}`,
            `Phone: ${input.phone || "Not provided"}`,
            `Subject: ${input.subject || "No subject"}`,
            `Message: ${input.message}`,
          ].join("\n")
        );
        return message;
      }),

    getAll: adminProcedure.query(async () => {
      const { getAllContactMessages } = await import("./db");
      return getAllContactMessages();
    }),

    updateStatus: adminProcedure
      .input((val: unknown) => {
        if (
          typeof val !== "object" ||
          val === null ||
          !("id" in val) ||
          !("status" in val)
        ) {
          throw new Error("Invalid input");
        }
        return val as { id: number; status: "new" | "reviewed" | "closed" };
      })
      .mutation(async ({ input }) => {
        const { updateContactMessageStatus } = await import("./db");
        return updateContactMessageStatus(input.id, input.status);
      }),
  }),
});

export type AppRouter = typeof appRouter;
